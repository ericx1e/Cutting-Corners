from fastapi import FastAPI
from pydantic import BaseModel
from io import BytesIO
from typing import List
import uvicorn
import os
import torch
from PIL import Image
import numpy as np
# import matplotlib.pyplot as plt
import base64
import io
from image_classifier import ImageClassifier, reversed_encoding

app = FastAPI()

class Drawing(BaseModel):
    base64_rep: str

class Player_and_Drawing(BaseModel):
    base64_rep: str
    gameid: int
    round_number: int
    player_index: int


storage = {

}
@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/api/v1/game")
async def store_player_imgs(to_store: Player_and_Drawing):
    if to_store.gameid in storage:
        game = storage[to_store.gameid]
        speficplayerarray = game[(to_store.player_index + to_store.round_number) % 4]
        speficplayerarray.append(to_store.base64_rep)
    else:
        storage[to_store.gameid] = [[] for _ in range(4)]
        print(storage)
        storage[to_store.gameid][(to_store.player_index + to_store.round_number) % 4] = [to_store.base64_rep]
    return storage

@app.get("/api/v1/game")
async def get_player_imgs(gameid: int, round: int, player_index: int):
    if gameid in storage:
        game = storage[gameid]
        return game[(player_index + round) % 4]
    else:
        return "Invalid Game ID"

@app.get("/api/v1/game/remove")
async def get_player_imgs(gameid: int):
    if gameid in storage:
        del storage[gameid]
        return storage
    else:
        return "Invalid Game ID"

@app.post("/api/v1/drawing/combine")
async def combine_images(drawings: List[Drawing]):
    decoded_images = []
    for drawing in drawings:
        img = drawing.base64_rep
        preprocessed = img[img.find(",")+1:]
        decoded_image = Image.open(BytesIO(base64.b64decode(preprocessed)))
        decoded_images.append(decoded_image)

    total_width = sum(image.width for image in decoded_images[0:2])
    total_height = sum(image.height for image in decoded_images[::2])

    combined_image = Image.new('RGB', (total_width, total_height))

    combined_image.paste(decoded_images[0], (0, 0))
    combined_image.paste(decoded_images[1], (total_width - decoded_images[1].width, 0))   
    combined_image.paste(decoded_images[2], (0, total_height - decoded_images[2].height))
    combined_image.paste(decoded_images[3], (total_width - decoded_images[3].width, total_height - decoded_images[3].height))

    buffered = BytesIO()
    combined_image.save(buffered, format="JPEG")
    base64_combined_image = base64.b64encode(buffered.getvalue()).decode()
    return base64_combined_image
# Now you have the base64 representation of the combined image


@app.post("/api/v1/drawing")
async def classify_drawing(drawing: Drawing):
    model = ImageClassifier()
    model.load_state_dict(torch.load("Model/model.pth"))
    model.eval()
    preprocessed_img = torch.tensor(compress_doodle(drawing.base64_rep)).float()
    prediction, prob = model.predict(preprocessed_img)
    return prediction, prob

def compress_doodle(image_base64: str):
    image_base64 = image_base64[image_base64.find(",")+1:]
    img = Image.open(io.BytesIO(base64.decodebytes(bytes(image_base64, "utf-8"))))
    img = img.resize((28, 28))
    img = img.convert('L')

    grayscale_matrix = np.zeros((28, 28), dtype=np.uint8)
    width, height = img.size

    for x in range(width):
        for y in range(height):
            pixel_value = img.getpixel([x, y])
            grayscale_matrix[x, y] = 255 - pixel_value

    return grayscale_matrix
