'use strict';

const mClient = require("mongodb").MongoClient;//драйвер для работы с mongo
const ax = require("axios");//отправка get/post запросов
const ws = require("ws");//сокеты
const cron = require("node-cron");//выполнение задач в определенное время

const url = "mongodb://localhost:27017/";//url БД

console.log(">>>===<<<");

//функция получения пользователей через api
async function GetUsers(){
    let jsonUsers = await ax.get("https://reqres.in/api/users?page=2");//Получаем
    let mongoClientUsers = new mClient(url, { useNewUrlParser: true, useUnifiedTopology: true });//конект с 
    mongoClientUsers.connect(function(err, client){//БД
        let coll = client.db("test").collection("users");//получаем объект коллекции
        if(err){
            console.error(err);
        }
        console.log("Начинаю запись");
        //обновление данных или добавление, если их нет
        coll.updateOne({page: 2}, {$set: jsonUsers.data}, {upsert: true}, (er) => {
            if(er){
                console.error(er);
            }
            client.close();//закрываем соединение с бд
        });
        console.log("Готово");   
    });
}

//функция поиска
function Get(name, sock){
    let isNameWithLast = name.indexOf('+') != -1 ? true : false;//проверка на наличие фамилии
    var lastname = "";
    if(isNameWithLast){
        lastname = name.substr(name.indexOf('+') + 1, name.length);//разбиваем строку на фамилию 
        name = name.substr(0, name.indexOf('+'));// и имя
    }

    let mongoClient = new mClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoClient.connect(function(err, client){
        let coll = client.db("test").collection("users");
        if(err){
            console.error(err);
        }
        //поиск запрошенных данных
        coll.findOne({page: 2}, function(e, r){
            if(e){
                console.error(e);
            }
            let user = isNameWithLast == false ? 
            r.data.filter(x => (x.first_name == name || x.last_name == name)) ://если только имя или фамилия
            r.data.filter(x => (x.first_name == name && x.last_name == lastname));//если имя и фамилия одновременно
            let answer = (user != '' && user != null) ? true : false;//формируем ответ
            sock.send(answer.toString());//отправляем ответ клиенту
            client.close();
        });
    });
}


//главная функция
function main(){
    cron.schedule("* * * * *", () => GetUsers());//выполнение задачи каждую минуту
    const socket = new ws.Server({port:3489});//создание сокет-сервера на порту 3489
    socket.on("connection", function(sock){//событие при подключении
        console.log("Есть подключение");
        sock.on("message", function(message){//обработчик входящих сообщений
            let text = JSON.parse(Buffer.from(message, "base64").toString());//декодирование
            Get(text.name, sock);//поиск
        });
        sock.on("close", function(){//обработчик при отключении клиента
            console.log("Нет подключения");
        });
    });
}
main();