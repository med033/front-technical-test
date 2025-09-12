module.exports = {
  items: [
    {
      id: "root-1",
      parentId: null,
      name: "Documents",
      folder: true,
      creation: new Date().toISOString(),
      modification: new Date().toISOString(),
    },
    {
      id: "file-1",
      parentId: "root-1",
      name: "test.txt",
      folder: false,
      creation: new Date().toISOString(),
      modification: new Date().toISOString(),
    },
  ],
};
