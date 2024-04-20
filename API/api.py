from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Drawing(BaseModel):
    drawing: List[List[int]]

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/api/v1/drawing")
async def create_drawing(drawing: Drawing):
    return drawing