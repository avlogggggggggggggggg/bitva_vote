document.addEventListener('DOMContentLoaded', () => {
    // Прелоадер
    let preloaderText = ['<span>Сайту, как и экстрасенсу,</span><br><span>нужно время, чтобы подгрузиться</span>', '<span>Чувствуем твоё желание…</span><br><span>скоро всё заработает</span>', '<span>Поднеси руку к экрану,</span><br><span>и всё заработает быстрее</span>', '<span>Уже подключили 6-е чувство,</span><br><span>чтобы всё скорее заработало.</span>'];
    document.querySelector('.voting-preloader_text').innerHTML = preloaderText[Math.floor(Math.random() * 4)];
    let preloaderStop = 0;
    let setIntervalControl = setInterval(() => {
        if (preloaderStop >= 3) {
            clearInterval(setIntervalControl);
            document.querySelector('.voting_preloader_start').classList.remove('voting_preloader_start');
            if (window.location.hash === '#voting-block') {
                setTimeout(() => {
                    document.querySelector('#project_extra_block').scrollIntoView({
                        block: "start"
                    });
                }, 300);
                history.pushState(null, null, window.location.href.slice(0, window.location.href.lastIndexOf('#')));
            }
        }
    }, 30);

    // DEV и PROD среды
    const HOST = window.location.origin === 'https://bitva-silnejshih.tnt-online.ru' ? 'https://tnt-online.ru' : 'https://tnt-preprod.ru';
    const HOSTVOTE = window.location.origin === 'https://bitva-silnejshih.tnt-online.ru' ? 'https://voting.umaws.ru' : 'https://tnt-vs-nodejs-api.tnt-vs-dev.zxz.su';

    // id голосования. Дефолтный для прода и в зависимости от гет параметра для препрода
    const VOTEID = window.location.origin === 'https://bitva-silnejshih.tnt-online.ru' ? 2 : window.location.search.replace('?', '');

    // token и sub
    let token = '';
    let sub = '';

    // Переменная, которая содержит activeStages при его наличии или lastActiveStage если activeStages нет (в зависимости от наличия/отсутствия активного этапа)
    let workStage;
    if (location.search.match(/err=1/)) {
        popupShare(`<div class="popup_wrap fadeIn dlg-modal-slide popup_voit_bitvaextrasensov">
                <div class="popup_close"><img src="https://tnt-online.ru/images/pop_close.png"></div>
                <div class="popup_wrap__main voit_bitvaextrasensov fadeIn">
                <div><p class="font-h2">Что-то пошло не так.</p><p class="body_text1">Повторите попытку или попробуйте позднее</p><div>
                </div></div></div></div>`);
        console.log('::::::::::: err :::::::::::');
        document.querySelector('.js-share').click();
    }

    // Получение данных по проекту
    fetch(`${HOST}/bitvaex`).then(response => {
        return response.json();
    }).then(data => {
        addFirstScreen(data.project);
        addPhotos(data.project.photos);
        addVideos(data.seasons, data.project.id);
        addPremieres(data.linkedProjects);
        preloaderStop++;
    }).catch(err => console.log(err));

    // Авторизация
    fetch(`${HOST}/ucav`, {
        method: "GET",
        credentials: "include"
    }).then(response => {
        return response.json();
    }).then(data => {
        if (data.token) {
            token = data.token;
            sub = data.sub;
        }
        if (data.token) window.readyToVote = true;
        getVotings();
    }).catch(err => console.log(err));

    //  Получение данных по этапу голосования
    function getVotings() {
        fetch(`${HOSTVOTE}/api/v1/votings/${VOTEID}`, {
            method: "GET"
        }).then(response => {
            if (response.headers.get('Content-Length') > 1) {
                return response.json();
            } else {
                document.querySelector('.project-poster_wrap-button-extra').style.display = 'none';
                preloaderStop = 4;
            }
        }).then(data => {
            workStage = data.activeStages.length > 0 ? data.activeStages : data.lastActiveStage;
            getStats(data);
        }).catch(err => console.log(err));
    }

    // Получение голосов для таблицы
    function getStats(votingsData) {
        fetch(`${HOSTVOTE}/api/v1/stats/${VOTEID}`).then(response => {
            return response.json();
        }).then(data => {
            let control = [];
            data.nominees.map(item => {
                // суммирование сумм голосов из разных этапов для каждого номинанта
                if (control.every(c => c.nomineeId !== item.nomineeId)) {
                    control.push({
                        nomineeId: item.nomineeId,
                        votesSum: item.votesAverage
                    });
                } else {
                    control.forEach((r, i) => {
                        if (r.nomineeId === item.nomineeId) {
                            control[i].votesSum = String(+control[i].votesSum + +item.votesAverage);
                        }
                    });
                }
            });
            if (token) {
                getRatings(votingsData, control);
            } else {
                dataProcessingForVote(votingsData, control, []);
            }
        }).catch(err => console.log(err));
    }

    // Получение оценки пользователя
    function getRatings(votingsData, statsData) {
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${token}`);
        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        };
        fetch(`${HOSTVOTE}/api/v1/votes/${VOTEID}/ratings`, requestOptions).then(response => {
            if (response.headers.get('Content-Length') > 1) {
                return response.json();
            } else {
                return [];
            }
        }).then(data => {
            dataProcessingForVote(votingsData, statsData, data);
        });
    }

    // ОБРАБОТКА ДАННЫХ ДЛЯ БЛОКА ГОЛОСОВАНИЯ
    function dataProcessingForVote(votingsData, statsData, data) {
        preloaderStop++;
        completingProject(votingsData, votingsData.nominees.map(nom => {
            // Передаем в таблицу с участниками объединенные массивы участников и суммы голосов
            if (!nom['votesSum']) nom['votesSum'] = 0;
            statsData.forEach(nomSum => {
                if (+nomSum.nomineeId === +nom.id) {
                    nom['votesSum'] = nomSum.votesSum;
                } else if (!nom['votesSum']) {
                    nom['votesSum'] = 0;
                }
            });
            return nom;
        }), data.length > 0 ? data.filter(item => {
            var _workStage$;
            return item.Source === "tntonline" && item.StageId === ((_workStage$ = workStage[0]) === null || _workStage$ === void 0 ? void 0 : _workStage$.id);
        }) : []);
    }

    // ПОПАП
    popupShare(`<div class="fadeIn popup_wrap__main popup_close"></div>`);
    function popupClose() {
        document.querySelector('.popup_wrap').addEventListener('click', e => {
            e.stopPropagation();
        });
        document.querySelector('.popup').addEventListener('click', () => {
            var _document$querySelect;
            (_document$querySelect = document.querySelector('.popup')) === null || _document$querySelect === void 0 || _document$querySelect.remove();
            document.querySelector('html').classList.remove('body_overflow');
        });
        document.querySelectorAll('.popup_close_too').forEach(item => {
            item.addEventListener('click', () => {
                var _document$querySelect2;
                (_document$querySelect2 = document.querySelector('.popup')) === null || _document$querySelect2 === void 0 || _document$querySelect2.remove();
                document.querySelector('html').classList.remove('body_overflow');
            });
        });
    }

    // ГОЛОСОВАНИЕ
    function votingProcess(data) {
        let voteButton = document.querySelectorAll('.active-vote-button');
        voteButton.forEach((item, i) => {
            item.addEventListener('click', () => {
                if (!window.readyToVote) {
                    popupAuth(`<div class="popup_wrap fadeIn dlg-modal-slide popup_auth">
                        <div class="popup_wrap__main fadeIn">
                        <div class="popup_close"><img src="https://tnt-online.ru/images/pop_close.png"></div>
                        <div class=""><div class="font-h2 auth_h2"> авторизация</div>
                        <div class="auth_text body_text1">
                        Ты на верном пути! Осталось авторизоваться, чтобы получить доступ к кастингам и голосованиям</div>
                        <div class="auth_button">
                        <a href="${HOST}/gauth?intended=${location.href}%23voting-block">
                        <button class="button-main auth-gid">
                        <img class="icon-gid" src="https://tnt-online.ru/images/2023/gid-icon.png" alt="гид"><div>
                        <span> Войти с Газпром ID </span><span class="icon-arrow">
                        <svg width="16" height="26" viewBox="0 0 16 26" fill="none" xmlns="http://www.w3.org/2000/svg">&gt;
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.731145 1.1638C1.33104 0.592467 2.28051 0.615624 2.85183 1.21552L13.8371 12.75L2.85183 24.2845C2.28051 24.8844 1.33104 24.9075 0.731145 24.3362C0.131249 23.7649 0.108092 22.8154 0.679421 22.2155L9.6942 12.75L0.679421 3.28449C0.108092 2.68459 0.131249 1.73512 0.731145 1.1638Z"></path>
                        </svg></span></div></button></a></div>
                        <div><a href="https://gid.ru/about" target="_blank" class="body_text3 auth_link">Подробнее о Газпром ID</a></div></div>
                        </div></div>`);
                    const linkLogin = `${HOST}/gauth?intended=${location.href}%23voting-block`;
                    const authButton = document.querySelector('.auth_button');
                    const authButtonHTML = document.querySelector('.auth_button').innerHTML;
                    authButton.innerHTML = `<a href="${linkLogin}">${authButtonHTML}</a>`;
                } else {
                    // 1. вызов попапа выбора оценки
                    let name = item.dataset.talentName;
                    let id = +item.dataset.talentId;
                    document.querySelector('.js-share').click();
                    document.querySelector('.popup').innerHTML = `<div class="fadeIn popup_wrap popup_close">
                        <div class="popup_evaluation_container">
                        <div class="popup_evaluation_top"><div>${name}</div><div class="popup_evaluation_close popup_close_too"><img src="https://tnt-online.ru/images/pop_close.png" alt="pop_close"></div></div>
                        <div class="popup_evaluation_bottom"><div class="popup_evaluation_description">Оцени работу экстрасенса от 1 до 10 баллов</div>
                        <div class="popup_evaluation_evaluations-container"><div class="popup_evaluation_evaluations"><div class="popup_evaluation_items"><div class="popup_evaluation_left_margin"></div><div class="popup_evaluation_item">1</div><div class="popup_evaluation_item">2</div><div class="popup_evaluation_item">3</div><div class="popup_evaluation_item">4</div><div class="popup_evaluation_item">5</div><div class="popup_evaluation_item">6</div><div class="popup_evaluation_item">7</div><div class="popup_evaluation_item">8</div><div class="popup_evaluation_item">9</div><div class="popup_evaluation_item">10</div><div class="popup_evaluation_right_margin"></div></div></div></div><button class="button-main popup_close_too red-white live" disabled="disabled"><div><span> оценить </span></div></button></div></div></div>`;
                    let estimation;
                    // 2. выбор оценки
                    document.querySelectorAll('.popup_evaluation_item').forEach(item => {
                        item.addEventListener('click', () => {
                            document.querySelectorAll('.popup_evaluation_item').forEach(item => {
                                item.classList.remove('active');
                            });
                            // document.querySelector('.popup_evaluation_evaluations').scrollTo({
                            //     left: (90/744*window.innerWidth) * +(item.innerHTML-1),
                            //     behavior: "smooth"
                            // });
                            estimation = item.innerHTML;
                            item.classList.add('active');
                            document.querySelector('.popup_evaluation_container button').disabled = false;
                        });
                    });
                    document.querySelector('.popup_evaluation_container button').addEventListener('click', () => {
                        // 3. вызов попапа подтверждения голоса
                        setTimeout(() => {
                            document.querySelector('.js-share').click();
                            document.querySelector('.popup').innerHTML = `<div class="popup_wrap fadeIn dlg-modal-slide popup_voit_bitvaextrasensov">
                            <div class="popup_close popup_close_too"><img src="https://tnt-online.ru/images/pop_close.png" alt="pop_close"></div>
                            <div class="popup_wrap__main voit_bitvaextrasensov fadeIn">
                            <div>
                            <p class="font-h2">Оценка работы экстрасенса</p>
                            <div class="popup-estimation">${estimation}</div>
                            <p class="body_text1">Ты уверен?</p>
                            <div>
                            <button class="button-main popup_close_too red-white send_void live"><div><span> оценить </span></div></button>
                            <button class="button-main popup_close_too show"><div><span> отмена </span></div></button>
                            </div></div></div></div>`;
                            // 4. отправление голоса
                            document.querySelector('.popup_voit_bitvaextrasensov .send_void').addEventListener('click', () => {
                                const myHeaders = new Headers();
                                myHeaders.append("Content-Type", "application/json");
                                myHeaders.append("Authorization", `Bearer ${token}`);
                                const raw = JSON.stringify({
                                    "userId": sub,
                                    "stageId": data.activeStages[0].id,
                                    "nomineeId": id,
                                    "value": +estimation,
                                    "source": "tntonline"
                                });
                                const requestOptions = {
                                    method: "POST",
                                    headers: myHeaders,
                                    body: raw,
                                    redirect: "follow"
                                };
                                fetch(`${HOSTVOTE}/api/v1/votes/${VOTEID}/ratings`, requestOptions).then(response => {
                                    return response.json();
                                }).then(data => {
                                    let button = document.querySelector(`.vote_nominee [data-talent-id='${data.nomineeId}']`);
                                    button.classList.remove('live', 'active-vote-button');
                                    button.disabled = true;
                                    button.innerHTML = `<div><span>оценка: ${data.value}</span></div>`;
                                    // 5. вызов попапа перехода в приложение
                                    // setTimeout(() => {
                                    //     document.querySelector('.js-share').click();
                                    //     document.querySelector('.popup').innerHTML = `<div class="popup_wrap fadeIn dlg-modal-slide popup_voit_bitvaextrasensov">
                                    //         <div class="popup_close popup_close_too"><img src="https://tnt-online.ru/images/pop_close.png"></div>
                                    //         <div class="popup_wrap__main voit_bitvaextrasensov fadeIn">
                                    //         <div><p class="font-h2">твой балл учтён!</p><p class="body_text1">Чтобы получить дополнительный балл - жми на кнопку!</p><div>
                                    //         <a id="voteGoAppPopUp" class="button-main popup_close_too live" href="https://redirect.appmetrica.yandex.com/serve/893830684651589341" target="_blank">
                                    //         <div><span>перейти</span><span class="icon-arrow">
                                    //         <svg width="16" height="26" viewBox="0 0 16 26" fill="none" xmlns="http://www.w3.org/2000/svg">&gt;
                                    //         <path fill-rule="evenodd" clip-rule="evenodd" d="M0.731145 1.1638C1.33104 0.592467 2.28051 0.615624 2.85183 1.21552L13.8371 12.75L2.85183 24.2845C2.28051 24.8844 1.33104 24.9075 0.731145 24.3362C0.131249 23.7649 0.108092 22.8154 0.679421 22.2155L9.6942 12.75L0.679421 3.28449C0.108092 2.68459 0.131249 1.73512 0.731145 1.1638Z"></path>
                                    //         </svg></span></div></a></div></div></div></div>`;
                                    //     // Сбор статистики из попапа "твой голос учтён"
                                    //     document.querySelector('#voteGoAppPopUp').addEventListener('click', () => {
                                    //         if (buttonControlPopUP) {
                                    //             buttonControlPopUP = false;
                                    //             ym(32937699, 'reachGoal', 'bitva-silnejshih_go_app_pop-up');
                                    //         }
                                    //     });
                                    //     popupClose();
                                    // }, 50);
                                });
                            });
                            popupClose();
                        }, 50);
                    });
                    popupClose();
                }
            });
        });

        // Сбор статистики с кнопки в баннере
        let buttonControlExtra = true;
        document.querySelector('.project-poster_wrap-button-extra').addEventListener('click', () => {
            if (buttonControlExtra) {
                buttonControlExtra = false;
                ym(32937699, 'reachGoal', 'bitva-silnejshih_golosuj');
            }
        });
        // Сбор статистики с кнопки "Получи больше голосов"
        let buttonControlShowGo = true;
        document.querySelector('#buttonShowGo').addEventListener('click', () => {
            if (buttonControlShowGo) {
                buttonControlShowGo = false;
                ym(32937699, 'reachGoal', 'bitva-silnejshih_go_app');
            }
        });
        // Контроль для сбора статистики из попапа "твой голос учтён"
        let buttonControlPopUP = true;
    }

    // ПЕРВЫЙ ЭКРАН ============================================================================================
    function addFirstScreen(data) {
        document.querySelector('.project-poster_video_serial_top').src = `${data.background_link}?loop=1&autoplay=false&playerVersion=latest&ui=2&autoPlay=only_without_sound&isClickDisabled=true`;
        document.querySelector('#beFilled_title').outerHTML = `${data.modified_title}`;
        document.querySelector('#beFilled_titleMob').outerHTML = `${data.title}`;
        document.querySelector('#beFilled_projectDescription').outerHTML = data.description;
        document.querySelector('#beFilled_ageText').outerHTML = `${data.age}+`;
        document.querySelector('#beFilled_mobPosterImg').outerHTML = `<picture><img src="${data.media.poster_mobile.image}" alt="Экстрасенсы реванш"></picture>`;
        document.querySelector('#beFilled_descPosterImg').outerHTML = `<picture><img src="${data.media.poster.image}" alt="Экстрасенсы реванш"></picture>`;
        document.querySelector('#beFilled_times').outerHTML = `${data.start_time.replace(":", '<span class="highlighted_colon">:</span>')}`;
        document.querySelector('#beFilled_timesPl').outerHTML = document.querySelector('#beFilled_timesMob').outerHTML = `${data.start_time_short.replace(":", '<span class="highlighted_colon">:</span>')}`;
    }

    // БЛОК ГОЛОСОВАНИЯ ========================================================================================
    function completingProject(votingsData, statsData, ratingsData) {
        document.querySelector('.voting_new_battle_psychics').style.display = 'block';
        if (workStage.length > 0 && workStage[0] !== null) {
            const VOTING = +votingsData.commonVoting;
            const RESULT = votingsData.showResults;
            const WINNER = +votingsData.showWinner > 0;
            // Блок голосуй
            document.querySelector('.center_container').style.display = 'block';
            let bitvaNominees = '';
            if (!WINNER) {
                workStage[0].nominees.forEach(item => {
                    // проверям есть ли оценка от пользователя
                    let rated = ratingsData.map(nom => nom.CandidateId === item.id && nom.Value).filter(item => item && item)[0];
                    bitvaNominees = bitvaNominees + `<div class="vote_nominee">
                    <div class="vote_nominee_left">
                        <img src="${item.imageUrl}" alt="vote nominee img">
                    </div>
                    <div class="vote_nominee_right ${!VOTING && 'vote_nominee_right-not-voting'}">
                        <div class="vote_nominee_name caption">${item.name}</div>
                         ${rated ? `<button class="button-main" disabled="disabled"><div><span>оценка: ${rated}</span></div></button>` : votingsData.activeStages.length > 0 ? `<button class="button-main live active-vote-button" data-talent-name="${item.name}" data-talent-id="${item.id}"><div><span>оценить</span></div></button>` : ''}
                    </div>
                </div>`;
                });
            } else {
                document.querySelector('#voting-block-title').outerHTML = '';
            }
            document.querySelector('.vote_nominees_container').innerHTML = bitvaNominees;
            // Таблица голосования
            if (votingsData.nominees.length > 0) {
                document.querySelector('.vote-table').style.display = 'block';
                if (RESULT) {
                    statsData.forEach(item => {
                        item.votesSum = +item.votesSum + item.votes;
                    });
                    statsData.reverse().sort(function (a, b) {
                        return parseFloat(a.votesSum) - parseFloat(b.votesSum);
                    }).reverse();
                }
                let participant = '';
                statsData.forEach((item, i) => {
                    participant = participant + `<div class="vote-participant ${workStage[0].nominees.some(nom => nom.id === item.id) && 'vote-participant-active'}">
                        <div class="vote-participant_line">
                            <div class="vote-participant_gradient"></div>
                            <div class="vote-participant_gradient vote-participant_gradient-left"></div>
                            <div class="vote-participant_name">${item.name}</div>
                            <div class="vote-participant_left">
                                ${RESULT ? `<div class="vote-participant-left_votes">${item.votesSum > 0 ? +item.votesSum.toFixed(1) : ''}</div>` : ''}
                            </div>
                        </div>
                        <div class="vote-participant_picture" style="background-image: url('${item.imageUrl}')">
                            ${RESULT ? `<div class="vote-participant_place">${i + 1}</div>` : ''}
                        </div>
                    </div>`;
                });
                document.querySelector('.vote-table-bottom_status').innerHTML = participant;
            }
            // document.querySelector('.vote-table_button-container').style.display = 'flex';
            votingProcess(votingsData);
        }

        // Заполнение описания голосования в зависимости от статуса голосования и этапа
        if (votingsData.activeStages.length > 0) {
            if (+votingsData.showWinner > 0) document.querySelector('#bitvaInfoBlockText').outerHTML = votingsData.description;else document.querySelector('#bitvaInfoBlockText').outerHTML = workStage[0].description;
        } else {
            document.querySelector('#bitvaInfoBlockText').outerHTML = votingsData.description;
        }
    }

    // Открытие/закрытие таблицы с участниками
    let tableHidden = false;
    document.querySelector('.vote-table-top_title').addEventListener('click', () => {
        if (tableHidden) {
            tableHidden = false;
            document.querySelector('.vote-table_bottom').style.height = 'auto';
            document.querySelector('.vote-table-top_title svg').style.transform = 'rotate(0)';
        } else {
            tableHidden = true;
            document.querySelector('.vote-table_bottom').style.height = '0';
            document.querySelector('.vote-table-top_title svg').style.transform = 'rotate(180deg)';
        }
    });

    // БЛОК "ФОТО" =============================================================================================
    function addPhotos(photos) {
        let bitvaPhotos = '';
        photos.forEach(item => {
            bitvaPhotos = bitvaPhotos + `<div>
                <div>
                    <picture>
                        <source srcset="${item.media.photo.responsive.webp}" type="image/webp">
                        <img data-src="${item.media.photo.image}" src="${item.media.photo.image}" loading="lazy" onload="if(!(width=this.getBoundingClientRect().width))return;this.onload=null;this.sizes=Math.ceil(width/window.innerWidth*100)+'vw';" alt="">
                    </picture>
                </div>
            </div>`;
        });
        document.querySelector('#bitvaPhotos').outerHTML = bitvaPhotos;
        carouselStart();
    }
    // Функция подключения слайдера к фотографиям
    function carouselStart() {
        tns({
            container: '.serial_gallery .serial_galley__slider',
            items: 1,
            edgePadding: 1,
            gutter: 0,
            lazyload: true,
            mouseDrag: true,
            nav: true,
            center: false,
            startIndex: 0,
            controls: true,
            responsive: {
                1024: {
                    items: 1,
                    edgePadding: 267,
                    gutter: 20,
                    mouseDrag: true,
                    nav: true,
                    center: true,
                    startIndex: 0
                },
                1400: {
                    items: 1,
                    edgePadding: 367,
                    gutter: 20,
                    mouseDrag: true,
                    nav: true,
                    center: true,
                    startIndex: 0
                }
            }
        });
    }

    // БЛОК "ВЫПУСКИ" ==========================================================================================
    function addVideos(seasons, projectId) {
        let limit = 0;
        // Переключение сезонов
        const listSeasons = seasons;
        if (listSeasons.length > 1) {
            let bitvaSeasonButton = '';
            listSeasons.forEach(item => {
                bitvaSeasonButton = bitvaSeasonButton + `<div class="tab font-h3 hover ${!bitvaSeasonButton ? 'active' : ''}" data-season="${item}">СЕЗОН ${item}</div>`;
            });
            document.querySelector('#bitvaSeasonButton').outerHTML = bitvaSeasonButton;
            // gettingVideoPreview(1, projectId);
            let tabs = document.querySelectorAll('.tabs_season .tab');
            tabs.forEach(item => {
                item.addEventListener('click', () => {
                    if (!item.classList.contains('active')) {
                        tabs.forEach(item => {
                            item.classList.remove('active');
                        });
                        item.classList.add('active');
                        limit = 0;
                        // document.querySelector('#bitvaVideoPreview').innerHTML = '';
                        gettingVideoPreview(item.getAttribute('data-season'), projectId);
                    }
                });
            });
        }
        // Конпка "Показать еще"
        document.querySelector('#bitvaButton').addEventListener('click', () => {
            if (document.querySelector('.tabs_season .tab.active')) {
                gettingVideoPreview(document.querySelector('.tabs_season .tab.active').getAttribute('data-season'), projectId);
            } else {
                gettingVideoPreview(listSeasons[0], projectId);
            }
        });
        // Функция получения с сервера списка видео превью
        // let limit = 0;
        gettingVideoPreview(listSeasons[0], projectId);
        async function gettingVideoPreview(season, id) {
            limit = limit + 6;
            let api = `${HOST}/api/get-video-list?total=1&limit=${limit}&offset=0&type=episode&project_id=${id}&season=${season}&serialShow=1`;
            await fetch(api).then(response => {
                return response.json();
            }).then(data => {
                preloaderStop++;
                document.querySelector('#bitvaVideoPreview').innerHTML = data.items;
                showVideoPreview();
                if (data.total > limit) {
                    document.querySelector('#bitvaButton').innerHTML = `<button class="button-main js-show-more js-show-more-492514 js-show-video js-show-more-videos show"><div><span>ПОКАЗАТЬ ЕЩЕ</span><span class="icon-arrow"><svg width="16" height="26" viewBox="0 0 16 26" fill="none" xmlns="http://www.w3.org/2000/svg">&gt;
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.731145 1.1638C1.33104 0.592467 2.28051 0.615624 2.85183 1.21552L13.8371 12.75L2.85183 24.2845C2.28051 24.8844 1.33104 24.9075 0.731145 24.3362C0.131249 23.7649 0.108092 22.8154 0.679421 22.2155L9.6942 12.75L0.679421 3.28449C0.108092 2.68459 0.131249 1.73512 0.731145 1.1638Z"></path></svg></span></div></button>`;
                } else {
                    if (document.querySelector('#bitvaButton button')) {
                        document.querySelector('#bitvaButton button').style.display = 'none';
                    }
                }
            }).catch(err => console.log(err));
        }
        // Открытие попапа с видео
        function showVideoPreview() {
            document.querySelectorAll('.serial_preview').forEach(item => {
                item.addEventListener('click', () => {
                    const project_slug = item.getAttribute('data-project-slug');
                    const video_slug = item.getAttribute('data-slug');
                    const video_type = item.getAttribute('data-type');
                    const api = `${HOST}/api/get-video-item?project_slug=${project_slug}&video_slug=${video_slug}&type=${video_type}`;
                    fetch(api).then(response => {
                        return response.json();
                    }).then(data => {
                        popupVideo(data.content);
                    }).catch(err => console.log(err));
                });
            });
        }
    }

    // БЛОК "ПРЕМЬЕРЫ" =========================================================================================
    function addPremieres(data) {
        let projectSectionMobileImg = document.querySelectorAll('.premieres_section .project_section_mobile_img');
        Object.values(data).forEach((item, i) => {
            if (projectSectionMobileImg[i]) {
                projectSectionMobileImg[i].innerHTML = `<a href="${item.finalUrl}"><img src="${item.media.poster.image}"></a>`;
            }
        });
    }
});
