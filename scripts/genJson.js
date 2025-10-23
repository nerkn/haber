import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DB_URL);

const [tags] = await conn.query("SELECT * FROM news_tags");
const [news] = await conn.query("SELECT * FROM news_article order by id desc limit 500");

const dist = path.resolve("dist");
fs.mkdirSync(dist, { recursive: true });
fs.copyFileSync("index.html", path.join(dist, "index.html"));
fs.writeFileSync(path.join(dist, "tags.json"), JSON.stringify(tags));
fs.writeFileSync(path.join(dist, "news.json"), JSON.stringify(news));

await conn.end();
