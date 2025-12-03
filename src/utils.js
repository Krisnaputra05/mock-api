const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");

const readData = (fileName) => {
  const filePath = path.join(dataDir, fileName);
  try {
    const rawData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn(
        `File ${fileName} tidak ditemukan, mengembalikan array kosong.`
      );
      return [];
    }
    console.error(`Gagal membaca data JSON dari ${fileName}:`, error);
    return [];
  }
};

const writeData = (fileName, data) => {
  const filePath = path.join(dataDir, fileName);
  try {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString, "utf8");
    return true;
  } catch (error) {
    console.error(`Gagal menulis data JSON ke ${fileName}:`, error);
    return false;
  }
};

module.exports = {
  readData,
  writeData,
};
