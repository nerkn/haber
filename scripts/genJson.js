import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DB_URL);
const dist = path.resolve("dist");
fs.mkdirSync(dist, { recursive: true });
let dbTables = {
  tags: "SELECT * FROM news_tags",
  news: "SELECT * FROM news_article order by id desc limit 500",
  tag_summaries: "SELECT * FROM news_tag_summaries",
}
for (const tableName in dbTables) {
  const query = dbTables[tableName];
  const [rows] = await conn.query(query);
  fs.writeFileSync(path.join(dist, `${tableName}.json`), JSON.stringify(rows));
}
await conn.end();
let files = ["main.js", "style.css", "index.html"];
for (const file of files) {
  fs.copyFileSync(file, path.join(dist, file));
}

