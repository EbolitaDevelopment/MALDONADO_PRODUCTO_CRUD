const express = require("express")
const dotenv=require("dotenv")
const mysql= require("mysql2")
var bodyParser=require('body-parser')
var app=express()
dotenv.config()
var con=mysql.createConnection({
    host:process.env.BASE_DE_DATOS_HOST,
    user:process.env.BASE_DE_DATOS_USER,
    password:process.env.BASE_DE_DATOS_PASSWORD,
    database:process.env.BASE_DE_DATOS_DATABASE
})
con.connect();

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(express.static('public'))

app.post('/agregarUsuario',(req,res)=>{

        let nombre=req.body.nombre
        con.query('INSERT INTO usuario (nombre) VALUES (?)', [nombre], (err, respuesta, fields) => {
            if (err) {
                console.log("Error al conectar", err);
                return res.status(500).send({message:"Error al conectar"});
            }
           
            return res.status(202).send({message:'ok',nombre: ` ${nombre}`});
        });
   
})

app.get('/obtenerUsuario',(req,res)=>{
    con.query('SELECT * from usuario', (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({message:"Error al conectar"});
        }
        console.log(respuesta)
        return res.status(202).send({message: 'ok',usuarios : respuesta});
    });

})
app.put('/obtenerUnUsuario',(req,res)=>{
    let id=req.body.id
    con.query('SELECT nombre from usuario WHERE id= (?)',[id], (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({message:"Error al conectar"});
        }
        console.log(respuesta)
        return res.status(202).send({message: 'ok',usuarios : respuesta});
    });

})

app.put('/editarUsuario',(req,res)=>{
    let id=req.body.id
    let nombre=req.body.nombre
    con.query('SELECT nombre FROM usuario WHERE id=(?)',[id] , (error, response,campos) => {
        if (error) {
            console.log("Error al conectar", err);
            return res.status(500).send({message:"Error al encontrar al usuario"});
            
        }
    if(response.length==0){
        return res.status(404).send({message:"No se encontro el usuario"});
    }
    con.query('UPDATE usuario SET nombre = (?) WHERE id =(?)',[nombre,id], (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({message:"Error al actualizar registro"});
        }
        console.log(respuesta.info)
        return res.status(202).send({message: 'ok',respuesta : respuesta.info});
    });});

})
app.delete('/BorrarUnUsuario',(req,res)=>{
    let id=req.body.id
    con.query('DELETE usuario FROM usuario WHERE id =(?)',[id], (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({message:"Error al conectar"});
        }
        console.log(respuesta)
        return res.status(202).send({message: 'ok',respuesta : respuesta.affectedRows});
    });

})

app.delete('/BorrarUsuarios',(req,res)=>{
    con.query('DELETE usuario FROM usuario;', (err, respuesta, fields) => {
        if (err) {
            console.log("Error al conectar", err);
            return res.status(500).send({message:"Error al conectar"});
        }
        console.log(respuesta)
        return res.status(202).send({message: 'ok',respuesta : respuesta.affectedRows});
    });

})
app.listen(3000,()=>{
    console.log('Servidor escuchando en el puerto 3000')
})