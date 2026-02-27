from modules.getenv import getenv
import psycopg2
from typing import TypedDict

class JobDetails(TypedDict):
    id: int
    status: str
    resourceId: str
    completedAt: str | None
    error: str | None
    retries: int
    createdAt: str
    updatedAt: str


class DatabaseService:
    _host = getenv("DB_HOST")
    _port = int(getenv("DB_PORT"))
    _user = getenv("DB_USER")
    _password = getenv("DB_PASSWORD")
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

    def get_image_key(self, image_id: str) -> str:
        # TODO: get image that does not have previewKey
        query = """
            SELECT "originalKey", filename 
            FROM images 
            WHERE id = %s
        """
        self._cur.execute(query, (image_id,))
        row = self._cur.fetchone()

        if not row:
            raise Exception("Image not found")
        
        return row[0]
    
    def update_image_preview(self, image_id: str, preview_key: str):
        query = """
            UPDATE images 
            SET "previewKey" = %s, "updatedAt" = NOW() 
            WHERE id = %s
        """
        self._cur.execute(query, (preview_key, image_id))
        self._conn.commit()
    
    def update_job_status(self, job_id: int, status: str, error: str | None = None, retries: int = 0):
        if error:
            query = """
                UPDATE jobs 
                SET status = %s, error = %s, retries = %s, "updatedAt" = NOW() 
                WHERE id = %s
            """
            self._cur.execute(query, (status, error, retries, job_id))
        else:
            query = """
                UPDATE jobs 
                SET status = %s, retries = %s, "updatedAt" = NOW(), "completedAt" = NOW()
                WHERE id = %s
            """
            self._cur.execute(query, (status, retries, job_id))
        self._conn.commit()

    def get_job_details(self, job_id: int) -> JobDetails:
        self._cur.execute("SELECT * FROM jobs WHERE id = %s", (job_id,))
        row = self._cur.fetchone()

        if not row:
            raise Exception("Job not found")
        
        return row[0]