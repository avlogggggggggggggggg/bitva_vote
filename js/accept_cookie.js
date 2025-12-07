/**
 *
 * @param cookieDomain Имя базового домена для установки cookie
 * @param cookiePeriod Период установки переменной accept_cookie в днях, по умолчанию 6 месяцев
 * @param cookieName Название переменной coookie, по умолчанию accept_cookie
 * @param messageText Текст сообщения, по умолчанию стандартный
 * @param btnText Текст кнопки, по умолчанию ok
 * @param cookieEnableText
 */
function GPMAcceptCookie(cookieDomain, cookiePeriod, cookieName, messageText, btnText) {
    var self = this;

    var yandexMetrika = false;//объект яндекс метрики
    var YMetrikaID = false;//ID счётчика метрики
    var googleAnalytics = false;//объект GA

    cookieName = cookieName || 'accept_cookie';//Название переменной coookie, по умолчанию accept_cookie
    cookiePeriod = cookiePeriod || 183;//Период установки, по умолчанию 6 месяцев
    messageText = messageText || 'Мы стремимся предложить Вам наилучший сервис при работе с нашим сайтом. Для этого мы собираем и храним информацию о Вашем посещении сайта. Так называемые cookies. Файлы cookies не собирают и не хранят никакую личную информацию о Вас. Используя этот сайт, Вы даете согласие на использование cookies. На данном этапе Вы можете отказаться от использования cookies, настроив необходимые параметры в своем браузере.';//текст плашки, по умолчанию стандартный
    btnText = btnText || 'ХОРОШО, ПОНЯТНО';//текст кнопки в плашке, по умолчанию ок
    var cookieDivClass = 'gpm-cookie-accepted';//класс плашки с сообщением
    var cookieVal = 'da';//значение cookie, по умолчанию da

    var warningShown = false;

    var messageBlock = "<p>" + messageText + "</p>";//блок сообщения
    var btnBlock = '<div class="btn-block"><span>' + btnText + '</span></div>';//блок кнопки

    /**
     * установка кук
     *
     * @param name
     * @param value
     */
    function createCookie(name, value) {
        var expires;
        var date = new Date();
        date.setTime(date.getTime()+(cookiePeriod*24*60*60*1000));
        expires = "; expires="+date.toGMTString();
        document.cookie = name+"="+value+"; "+"domain=."+cookieDomain+"; path=/;"+expires;
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

    /**
     * проверяет установленные куки и, если они не установлены
     *
     * @returns {Boolean} true - пользователь уже согласился,
     * false - показать плашку
     */
    function isCookieAccepted() {
        var userCookieVal = readCookie(cookieName);
        return (userCookieVal == cookieVal);
    }
    /**
     * генерирует плашку
     * проставляет события клика по кнопке
     *
     */
    function showCookieAccepted() {
        if (!warningShown) {
            self.warningShown = true;
            var cookieDiv = document.createElement('div');
            cookieDiv.className = cookieDivClass;
            cookieDiv.classList.add('container')
            cookieDiv.innerHTML = '<div class="' + cookieDivClass +
                '-container">' +
                messageBlock + btnBlock + '</div>';
            document.body.appendChild(cookieDiv);
            cookieDiv.onclick = function(event) {
                var event = event || window.event;
                if (event.target.tagName == 'SPAN') {
                    handleCookieAccepted();
                }
                return true;
            }
        }
    }
    /**
     * ставит куки
     * отправляет события аналитики, если есть обработчики
     *
     */
    function handleCookieAccepted() {
        var elem = document.querySelector("."+cookieDivClass);
        elem.parentNode.removeChild(elem);
        self.warningShown = false;
        createCookie(cookieName, cookieVal);
        if (self.googleAnalytics()) {
            var ga = self.googleAnalytics();
            ga('send', 'event', 'plashka_cookie', 'Клик', 'согласен');
        }
        if (self.yandexMetrika() && self.YMetrikaID()) {
            var metrika = self.yandexMetrika();
            metrika(self.YMetrikaID(), 'reachGoal', 'click_cookie_plashka');
        }
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
    this.googleAnalytics = function(analyticsObject) {
        if (!arguments.length)
            return googleAnalytics;
        googleAnalytics = analyticsObject;
    };


    /**
     * показывает плашку, если это необходимо
     */
    this.check = function() {
        if (!isCookieAccepted()) {
            showCookieAccepted();
        };
    };
}
