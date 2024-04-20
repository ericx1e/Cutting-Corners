from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uvicorn
import os

app = FastAPI()

class Drawing(BaseModel):
    drawing: List[List[int]]

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/api/v1/drawing")
async def create_drawing(drawing: Drawing):
    return drawing

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=os.getenv("PORT", default=5000), log_level="info")