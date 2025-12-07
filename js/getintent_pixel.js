/**
*
* @param baseDomain Имя базового домена для установки cookie и передачи в пиксель
*/
function GetintentPixel(baseDomain) {
    var self = this;

    /*var cookiePeriod = 183;//Период установки, по умолчанию 6 месяцев*/
    var YMetrikaID = false;//ID счётчика метрики
    var yandexMetrika = false;//объект яндекс метрики
    var cookieName = 'getintent_pixel';//Название переменной coookie
    var cookieVal = 'sended';//значение cookie, по умолчанию da
    var cookieValAuth = "sended_auth"; //значение cookie, по умолчанию da

    /**
    * установка кук
    *
    * @param name
    * @param value
    */
    function createCookie(name, value) {
        /*var expires;
        var date = new Date();
        date.setTime(date.getTime()+(cookiePeriod*24*60*60*1000));
        expires = "; expires="+date.toGMTString();*/
        document.cookie = name+"="+value+"; "+"domain=."+baseDomain+"; path=/;";
    }
    /**
    * чтение кук
    *
    * @param name
    */
    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1,c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length,c.length);
            }
        }
        return null;
    }

    this.yandexMetrika = function(metrikaObject) {
        if (!arguments.length)
            return yandexMetrika;
        yandexMetrika = metrikaObject;
    };

    this.YMetrikaID = function(metrikaID) {
        if (!arguments.length)
            return YMetrikaID;
        YMetrikaID = metrikaID;
    };

    /**
    * проверяет установленные куки
    *
    * @returns {Boolean} true - пользователь уже отправлен в GetIntent
    * false - добавить пиксель
    */
    function isSendedGetintentPixel() {
        var userCookieVal = readCookie(cookieName);
        return (userCookieVal == cookieVal);
    }
    function isSendedGetintentPixelAuth() {
        var userCookieVal = readCookie(cookieName);
        return userCookieVal == cookieValAuth;
    }
    /**
    * ставит куки
    * добавляет на сайт пиксель
    *
    */
    this.addGetintentPixel = function() {
        if (!isSendedGetintentPixel()) {
            if (self.yandexMetrika()) {
                createCookie(cookieName, cookieVal);
                var metrika = self.yandexMetrika();
                metrika(self.YMetrikaID(), 'getClientID', function(clientID) {
                    let Pixel = document.createElement("img");
                    Pixel.src = "//px.adhigh.net/p/cm/gpm?u="+clientID+"&source="+baseDomain;
                    Pixel.style.width = '1px';
                    Pixel.style.height = '1px';
                    Pixel.style.position = 'absolute';
                    document.body.appendChild(Pixel);
                });
            }
        }
    }
    this.addGetintentPixelAuth = function(passMediaId) {
        if (!isSendedGetintentPixelAuth()) {
            createCookie(cookieName, cookieValAuth);
            let Pixel = document.createElement("img");
            Pixel.src =
                "//px.adhigh.net/p/cm/passm?u=" + passMediaId + "&source=" + baseDomain;
            document.body.appendChild(Pixel);
        }
    };
}
