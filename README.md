## Inspiration
We wanted to create a game that matched the vibe of our favorite co-op multiplayer games, like [Gartic Phone](https://garticphone.com/) and [Jackbox](https://www.jackboxgames.com/) but with a technical twist.
## What it does
Welcome to CuttingCorners- a telephone-esque drawing game you can enjoy with 3 of your friends. Given part of a picture, exercise your artistic ability by trying to fill in the rest using your imagination and godlike intuition! At the end, see how you and your friends did by checking if our AI agent can guess what you were trying to draw!
## How we built it
We are using p5js, a javascript graphics library, along with custom images for our frontend. To build the online multiplayer we are using express and Socket.io. We are hosting our server on Heroku, which manages lobbies, communication between clients, and requests to and from our API.

To power the classifier, we used pytorch to replicate a cutting-edge CNN architecture for image classification, Alexnet. We trained the network on 25000 data points from 25 different classes, and consistently achieved 80-90% test accuracy. Afterwards, we connected the saved model to our API to enable the app to classify user inputs and give a confidence score for the classification. The dataset comes from an open sourced project by Google called ‘Quick, Draw!’

To have the frontend be able to utilize our model, we decided to use FastAPI to build a Restful API that is able to take in base64, a string representation of the user-drawn image, and manipulate it in order to compress it down into a 28x28 grayscale matrix that our model needs as input. We then used Railway to host our python backend.
## Accomplishments that we're proud of
We're really proud of how fun the game is - we couldn't stop laughing playing it, and others seemed to have found it fun too. It makes the grind worth it to build an actually enjoyable hack that anyone can use!
## What we learned
We gained experience working with large datasets for computer vision and image classification tasks, deploying python APIs, working with base64 image data and using p5.js to build a robust multiplayer system. 
## What's next for CuttingCorners
We hope to introduce new features into our game, such as different game modes and difficulties, and train the model on more classes to allow for a more robust gaming experience.
