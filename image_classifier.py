import torch.nn as nn
import torch
import torch.nn.functional as F

reversed_encoding = {
        0: 'airplane',
        1: 'car',
        2: 'dragon',
        3: 'crocodile',
        4: 'computer',
        5: 'elephant',
        6: 'flower',
        7: 'guitar',
        8: 'hamburger',
        9: 'helicopter',
        10: 'house',
        11: 'hurricane',
        12: 'jail',
        13: 'keyboard',
        14: 'leaf',
        15: 'mermaid',
        16: 'microwave',
        17: 'monkey',
        18: 'pants',
        19: 'broccoli',
        20: 'brain',
        21: 'raccoon',
        22: 'radio',
        23: 'sink'
    }


class ImageClassifier(nn.Module):
    def __init__(self):
        super(ImageClassifier, self).__init__()
        # goal: simplified Alexnet architecture
        # input: 28x28x1 image, grayscaled
        # first idea: 3 conv-relu-pool layers, followed by 2 fc layers and softmax non-linearity

        self.conv_layers = nn.Sequential(
            nn.Conv2d(1, 10, 3, 1, 'same'),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(10, 20, 3, 1, 'same'),
            nn.ReLU(),
            nn.MaxPool2d(2, 2)
        )

        self.linear_layers = nn.Sequential(
            nn.Linear(980, 980),
            nn.ReLU(),
            nn.Dropout(p=.2),
            nn.Linear(980, 24)
        )

    def forward(self, x):
        x = self.conv_layers(x)
        x = torch.flatten(x, start_dim=1)
        return self.linear_layers(x)

    def predict(self, x):
        x = torch.reshape(x, (1, 1, 28, 28))
        output = self.forward(x)
        softmax_tensor = F.softmax(output, dim=1).detach()
        print(softmax_tensor)
        return reversed_encoding[torch.argmax(output, dim=1).item()], softmax_tensor[
            0, torch.argmax(output, dim=1).item()].item()
