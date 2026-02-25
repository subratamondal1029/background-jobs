from modules.getenv import getenv
import psycopg2

class DatabaseService:
    _host = (getenv("DB_HOST"),)
    _port = (getenv("DB_PORT"),)
    _user = (getenv("DB_USER"),)
    _password = (getenv("DB_PASSWORD"),)
    _dbname = getenv("DB_DB")
    
    def __init__(self) -> None:
        self._conn = psycopg2.connect(
            host=self._host,
            port=self._port,
            user=self._user,
            password=self._password,
            database=self._dbname
        )

        self._cur = self._conn.cursor()

    def close(self):
        self._cur.close()
        self._conn.close()

    def get_image_key(self, image_id: str):
        self._cur.execute("SELECT originalKey, filename FROM images WHERE id = %s", (image_id,))
        row = self._cur.fetchone()

        if not row:
            raise Exception("Image not found")
        
        return row
    
    def update_image_preview(self, image_id: str, preview_key: str):
        self._cur.execute("UPDATE images SET previewKey = %s WHERE id = %s", (preview_key, image_id))
        self._conn.commit()