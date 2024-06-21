const express = require('express')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const dbpath = path.join(__dirname, 'userData.db')

app.use(express.json())
let db = null
const createdatabase = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server started')
    })
  } catch (error) {
    console.log(`Db error ${error.message}`)
    process.exit(1)
  }
}

createdatabase()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const query = `
  SELECT 
    *
  FROM
    user
  WHERE
    username='${username}';`
  const data = await db.get(query)
  if (data !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const modifiedpassword = await bcrypt.hash(password, 10)
      const code = `
            INSERT INTO
                user(username,name,password,gender,location)
            VALUES
                ('${username}',
                '${name}',
                '${modifiedpassword}',
                '${gender}',
                '${location}');`
      await db.run(code)
      response.status(200)
      response.send('User created successfully')
    }
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const query = `
  SELECT 
    *
  FROM
    user
  WHERE
    username='${username}';`
  const data = await db.get(query)
  if (data === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const checkpassword = await bcrypt.compare(password, data.password)
    if (!checkpassword) {
      response.status(400)
      response.send('Invalid password')
    } else {
      response.send('Login success!')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const query = `
  SELECT 
    *
  FROM
    user
  WHERE
    username='${username}';`
  const data = await db.get(query)
  if (data === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const checkpassword = await bcrypt.compare(oldPassword, data.password)
    if (checkpassword) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const modifiedpassword = await bcrypt.hash(newPassword, 10)
        const query = `
              UPDATE 
                user
              SET 
                password='${modifiedpassword}'
              WHERE 
                username='${username}';`
        await db.run(query)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
