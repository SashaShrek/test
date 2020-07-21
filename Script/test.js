const socket = new WebSocket("ws://188.227.86.17:3489");//подключение к сокет-серверу к 3489 порту

//класс при загрузке страницы
class Loader{
    Load(){//метод при загрузке страницы
        this.Events();
    }
    Events(){//создание событий
        $(".mdiv > p > button")[0].addEventListener("click", () => new Searcher().Search());//клик по кнопке
    }
}

//класс поиска
class Searcher{
    Search(){//поиск
        let user = $(".mdiv > p > input");//получаем объект поля
        let nameUser = user.val();// и его значение
        nameUser = nameUser.replace(/ /, '+').replace(/ /g, '');//если есть пробел, заменяет его на '+', остальные убирает
        let data = {//создаем объект
            name: nameUser//присваиваем элементу name объекта data значение поля 
        }
        let json = JSON.stringify(data);//преобразование в json
        let enc = btoa(unescape(encodeURIComponent(json)));//кодирование в base64
        socket.send(enc);//отправка на сокет-сервер
        user.val(null);//обнуление поля
        socket.onmessage = function(msg){//ждем ответ от сервера
            alert(msg.data);//вывод сообщения
        };
    }
}