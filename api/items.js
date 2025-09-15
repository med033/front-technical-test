const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

let itemsIndex = {};
const upload = multer({ dest: 'uploads/' });

function buildItemsIndex() {
	itemsIndex = {};
	db.items.forEach(item => {
		if (!itemsIndex[item.parentId]) {
			itemsIndex[item.parentId] = [];
		}
		itemsIndex[item.parentId].push(item);
	});
}

function saveDatabase() {
	try {
		const dbPath = path.join(__dirname, 'db.js');
		const dbContent = `module.exports = ${JSON.stringify(db, null, 2)};`;
		fs.writeFileSync(dbPath, dbContent, 'utf8');
	} catch (error) {
		console.error('Error saving database:', error);
		throw error;
	}
}

// Initialisation
buildItemsIndex();
// -----------------------------
// GET /api/items
// -----------------------------
router.get('/items', (req, res) => {
	const parentId = req.query.parentId || null;
	const items = parentId ? itemsIndex[parentId] || [] : db.items;
	res.json({ items });
});

// -----------------------------
// POST /api/items (Create folder or file)
// -----------------------------
router.post('/items', upload.single('file'), (req, res) => {
	try {
		const { name, folder, parentId } = req.body;

		if (req.file) {
			const newItem = {
				id: uuidv4(),
				parentId: parentId || null,
				name: req.file.originalname,
				folder: false,
				filePath: req.file.filename,
				creation: new Date().toISOString(),
				modification: new Date().toISOString(),
			};

			db.items.push(newItem);
			buildItemsIndex();
			saveDatabase();
			return res.status(201).json(newItem);
		}

		if (!name || folder === undefined) {
			return res
				.status(400)
				.json({ code: 'INVALID', desc: 'Name and folder are required' });
		}

		const newItem = {
			id: uuidv4(),
			parentId: parentId || null,
			name,
			folder: folder === 'true' || folder === true,
			creation: new Date().toISOString(),
			modification: new Date().toISOString(),
		};

		db.items.push(newItem);
		buildItemsIndex();
		saveDatabase();
		res.status(201).json(newItem);
	} catch (error) {
		console.error('Error creating item:', error);
		res
			.status(500)
			.json({ code: 'SERVER_ERROR', desc: 'Internal server error' });
	}
});

// -----------------------------
// GET /api/items/:itemId (Download file)
// -----------------------------
router.get('/items/:itemId', (req, res) => {
	try {
		const item = db.items.find(i => i.id === req.params.itemId);
		if (!item) {
			return res
				.status(404)
				.json({ code: 'NOT_FOUND', desc: 'Item not found' });
		}

		if (item.folder) {
			return res
				.status(400)
				.json({ code: 'IS_FOLDER', desc: 'Cannot download a folder' });
		}

		const filePath = path.join(__dirname, 'uploads', item.filePath);
		if (!fs.existsSync(filePath)) {
			return res
				.status(404)
				.json({ code: 'FILE_NOT_FOUND', desc: 'File not found on server' });
		}

		res.download(filePath, item.name);
	} catch (error) {
		console.error('Error downloading file:', error);
		res
			.status(500)
			.json({ code: 'SERVER_ERROR', desc: 'Internal server error' });
	}
});

// -----------------------------
// DELETE /api/items/:itemId
// -----------------------------
router.delete('/items/:itemId', (req, res) => {
	try {
		const index = db.items.findIndex(i => i.id === req.params.itemId);
		if (index === -1) {
			return res
				.status(404)
				.json({ code: 'NOT_FOUND', desc: 'Item not found' });
		}

		const item = db.items[index];

		if (item.folder) {
			const hasChildren = db.items.some(i => i.parentId === item.id);
			if (hasChildren) {
				return res.status(400).json({
					code: 'FOLDER_NOT_EMPTY',
					desc: 'Cannot delete folder that contains items',
				});
			}
		}

		if (!item.folder && item.filePath) {
			const filePath = path.join(__dirname, 'uploads', item.filePath);
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath);
			}
		}

		db.items.splice(index, 1);
		buildItemsIndex();
		saveDatabase();
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting item:', error);
		res
			.status(500)
			.json({ code: 'SERVER_ERROR', desc: 'Internal server error' });
	}
});

// -----------------------------
// PATCH /api/items/:itemId (Move or rename)
// -----------------------------
router.patch('/items/:itemId', (req, res) => {
	try {
		const item = db.items.find(i => i.id === req.params.itemId);
		if (!item) {
			return res
				.status(404)
				.json({ code: 'NOT_FOUND', desc: 'Item not found' });
		}

		if (req.body.parentId !== undefined) {
			if (req.body.parentId === item.id) {
				return res.status(400).json({
					code: 'INVALID_PARENT',
					desc: 'Item cannot be its own parent',
				});
			}

			if (
				req.body.parentId &&
				!db.items.some(i => i.id === req.body.parentId)
			) {
				return res.status(404).json({
					code: 'PARENT_NOT_FOUND',
					desc: 'Parent item not found',
				});
			}

			item.parentId = req.body.parentId;
		}

		if (req.body.name !== undefined) {
			if (!req.body.name.trim()) {
				return res.status(400).json({
					code: 'INVALID_NAME',
					desc: 'Name cannot be empty',
				});
			}

			const siblingExists = db.items.some(
				i =>
					i.parentId === item.parentId &&
					i.name === req.body.name &&
					i.id !== item.id
			);

			if (siblingExists) {
				return res.status(409).json({
					code: 'DUPLICATE_NAME',
					desc: 'An item with this name already exists in this location',
				});
			}

			item.name = req.body.name;
		}

		item.modification = new Date().toISOString();
		buildItemsIndex();
		saveDatabase();
		res.json(item);
	} catch (error) {
		console.error('Error updating item:', error);
		res
			.status(500)
			.json({ code: 'SERVER_ERROR', desc: 'Internal server error' });
	}
});

// -----------------------------
// GET /api/items/:itemId/path (Retrieve path)
// -----------------------------
router.get('/items/:itemId/path', (req, res) => {
	try {
		const itemId = req.params.itemId;
		const pathItems = [];
		let current = db.items.find(i => i.id === itemId);

		if (!current) {
			return res
				.status(404)
				.json({ code: 'NOT_FOUND', desc: 'Item not found' });
		}

		while (current) {
			pathItems.unshift(current);
			current = current.parentId
				? db.items.find(i => i.id === current.parentId)
				: null;
		}

		res.json({ items: pathItems });
	} catch (error) {
		console.error('Error getting item path:', error);
		res
			.status(500)
			.json({ code: 'SERVER_ERROR', desc: 'Internal server error' });
	}
});

module.exports = router;
