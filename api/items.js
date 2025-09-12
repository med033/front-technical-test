const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const multer = require('multer');

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
	res.status(201).json(newItem);
});

// -----------------------------
// GET /api/items/:itemId (Download file)
// -----------------------------
router.get('/items/:itemId', (req, res) => {
	const item = db.items.find(i => i.id === req.params.itemId);
	if (!item) {
		return res.status(404).json({ code: 'NOT_FOUND', desc: 'Item not found' });
	}
	res.send(`File content of ${item.name}`);
});

// -----------------------------
// DELETE /api/items/:itemId
// -----------------------------
router.delete('/items/:itemId', (req, res) => {
	const index = db.items.findIndex(i => i.id === req.params.itemId);
	if (index === -1) {
		return res.status(404).json({ code: 'NOT_FOUND', desc: 'Item not found' });
	}
	db.items.splice(index, 1);
	res.status(204).send();
});

// -----------------------------
// PATCH /api/items/:itemId (Move or rename)
// -----------------------------
router.patch('/items/:itemId', (req, res) => {
	const item = db.items.find(i => i.id === req.params.itemId);
	if (!item) {
		return res.status(404).json({ code: 'NOT_FOUND', desc: 'Item not found' });
	}

	if (req.body.parentId !== undefined) {
		item.parentId = req.body.parentId;
	}
	if (req.body.name) {
		item.name = req.body.name;
	}

	item.modification = new Date().toISOString();
	res.json(item);
});

// -----------------------------
// GET /api/items/:itemId/path (Retrieve path)
// -----------------------------
router.get('/items/:itemId/path', (req, res) => {
	const itemId = req.params.itemId;
	const path = [];
	let current = db.items.find(i => i.id === itemId);

	if (!current) {
		return res.status(404).json({ code: 'NOT_FOUND', desc: 'Item not found' });
	}

	while (current) {
		path.unshift(current);
		current = current.parentId
			? db.items.find(i => i.id === current.parentId)
			: null;
	}

	res.json({ items: path });
});

module.exports = router;
