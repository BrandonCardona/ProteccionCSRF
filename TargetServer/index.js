const express = require('express');
const session = require('express-session');
const flash = require('connect-flash-plus');
const handlebars = require('express-handlebars');
const {v4: uuid} = require('uuid');
const cors = require('cors');
const fs = require('fs');

// Importa el módulo path
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para servir archivos estáticos desde la carpeta 
app.use(express.static(path.join(__dirname)));

// Middlewares

app.use(express.urlencoded({extended:true}));

app.use(session({
    secret: 'test',
    resave: false,
    saveUninitialized: false,
}));
app.use(flash());
app.set("views", __dirname);
app.engine("hbs", handlebars({
  defaultLayout: 'main',
  layoutsDir: __dirname,
  extname: '.hbs',
}));
app.set("view engine", "hbs");

// Login

const login = (req, res, next) => {
    if(!req.session.userId){
        res.redirect('/login');
    }else{
        next();
    }
}

// CSRF

const tokens = new Map();

const csrfToken = (sessionID) => {
    const token = uuid();
    tokens.get(sessionID).add(token);
    setTimeout(()=> tokens.get(sessionID).delete(token), 180000);

    return token;
}

const csrf = (req, res, next) =>{
    const token = req.body.csrf;
    if(!token  || !tokens.get(req.sessionID).has(token)){
        res.status(422).send('CSRF Token missing o expired');
    }else {
        next();
    }
}

// DB

const users = JSON.parse(fs.readFileSync('db.json'));

// Routes

app.get('/home', login, (req, res)=>{
    res.render('home');
    //res.send('Home page, must be logged in to access');
})

app.get('/login', (req, res)=>{
    console.log(req.session);
    res.render('login');
});

app.get('/', login, (req, res)=>{
    res.render('home');
});


app.post('/login', (req, res)=>{

    if (!req.body.email || !req.body.password){
        req.flash('message', 'Fill all the fields');
        return res.status(400).send('Fill all the fields');
    }

    const user = users.find(user => user.email === req.body.email);
    if (!user || user.password !== req.body.password){
        req.flash('message', 'Invalid credentials');
        return res.redirect('login');
    }
    req.session.userId = user.id;
    tokens.set(req.sessionID, new Set());
    console.log(req.session);
    res.redirect('/home');
})

app.get('/logout', login, (req, res)=>{
    req.session.destroy();
    res.render('logout');
});

app.get('/edit', login, (req, res)=>{
    res.render('edit', {token: csrfToken(req.sessionID)});
});

app.post('/edit', login, csrf, (req, res)=>{
    const user = users.find(user => user.id === req.session.userId);
    user.email = req.body.email;
    user.password = req.body.password;

    console.log(`User ${user.id} email changed to ${user.email}`);
    console.log(`User ${user.id} password changed to ${user.password}`);

    res.render('changed');
});

// Server

app.listen(PORT, ()=> console.log(`Listening on PORT ${PORT}`));