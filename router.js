const express = require('express');
const router = express.Router();
const db  = require('./dbConnection');
const { signupValidation, loginValidation } = require('./validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', signupValidation, (req, res) => {
  db.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(req.body.email)});`,
    (err, result) => {
      if (result.length) {
        return res.status(409).send({
          msg: 'This user is already in use'
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).send({
              msg: err
            });
          } else {
            db.query(
              `INSERT INTO users (name, email, password) VALUES ('${req.body.name}', ${db.escape(
                req.body.email
              )}, ${db.escape(hash)})`,
              (err) => {
                if (err) {
                  throw err;
                }
                return res.status(201).send({
                  msg: 'User successfully Register.'
                });
              }
            );
          }
        });
      }
    }
  );
});


router.post('/login', loginValidation, (req, res) => {
  db.query(
    `SELECT * FROM users WHERE email = ${db.escape(req.body.email)};`,
    (err, result) => {
      if (err) {
        throw err;
      }
      if (!result.length) {
        return res.status(401).send({
          msg: 'Email or password is incorrect!'
        });
      }
      bcrypt.compare(
        req.body.password,
        result[0]['password'],
        (bErr, bResult) => {
          if (bErr) {
            throw bErr;
          }
          if (bResult) {
            const token = jwt.sign({id:result[0].id},'the-super-strong-secrect',{ expiresIn: '1h' });
            db.query(
              `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
            );
            return res.status(200).send({
              msg: 'Logged in',
              token,
              user: result[0]
            });
          }
          return res.status(401).send({
            msg: 'Username or password is incorrect'
          });
        }
      );
    }
  );
});

module.exports = router;
