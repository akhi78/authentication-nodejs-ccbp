const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
const DbPath = path.join(__dirname, "userData.db");
app.use(express.json());
let db = null;
//Initialize DataBse and Server

const InitializeDbAndServer = async () => {
  try {
    db = await open({
      filename: DbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("App si running smoothly");
    });
  } catch (e) {
    console.log(`Db Error is ${e}`);
  }
};

InitializeDbAndServer();

//API 1 post and their senerios

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const query = `select * from user where username='${username}'`;
  const getUsername = await db.get(query);

  if (getUsername === undefined) {
    if (password.length > 5) {
      const InsertQuery = `INSERT INTO user(username,name,password,gender,location)
          Values('${username}','${name}','${hashedPassword}','${gender}','${location}')`;
      const Data = await db.run(InsertQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2 post for login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const Query = `select * From user where username='${username}'`;
  const getUserData = await db.get(Query);

  if (getUserData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const IsPasswordMatched = await bcrypt.compare(
      password,
      getUserData.password
    );
    if (IsPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 put and change password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const query = `select * from user where username='${username}'`;
  const UserData = await db.get(query);
  if (UserData === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const IsPasswordMatched = await bcrypt.compare(
      oldPassword,
      UserData.password
    );
    if (IsPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const UpdateQuery = `UPDATE user SET password='${hashedPassword}' where username='${username}'`;
        const UpdateDone = await db.run(UpdateQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
