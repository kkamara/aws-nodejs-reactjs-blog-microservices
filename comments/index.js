const express = require("express");
const { randomBytes, } = require("node:crypto");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

app.post("/posts/:id/comments", async (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { content, } = req.body;

  const comments = commentsByPostId[req.params.id] || [];

  comments.push({
    id: commentId,
    status: "pending",
    content,
  });

  commentsByPostId[req.params.id] = comments;

  await axios.post(
    "http://localhost:4005/events",
    {
      type: "CommentCreated",
      data: {
        postId: req.params.id,
        id: commentId,
        status: "pending",
        content,
      }
    }
  );

  res.status(201).send(comments);
});

app.post("/events", async (req, res) => {
  console.log("Received Event:", req.body.type);

  const { type, data, } = req.body;

  if ("CommentModerated" === type) {
    const {
      postId,
      id,
      status,
      content,
    } = commentsByPostId;

    const comments = commentsByPostId[postId];

    const comment = comments.find(comment => {
      return comment.id === id;
    });
    comment.status = status;

    await axios.post(
      "http://localhost:4005",
      {
        type: "CommentUpdated",
        data: {
          id,
          status,
          postId,
          content,
        }
      }
    )
  }

  res.send({});
});

app.listen(4001, () => {
  console.log("Listening on port 4001");
});