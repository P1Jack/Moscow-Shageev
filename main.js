"use strict";


const CPU_CORES = navigator.hardwareConcurrency;
const STORED_CPU_CORES = localStorage.getItem("cores");
let SELECTED_CPU_CORES;
if (STORED_CPU_CORES) SELECTED_CPU_CORES = STORED_CPU_CORES;
else SELECTED_CPU_CORES = CPU_CORES;

pdfjsLib.GlobalWorkerOptions.workerSrc = "/static/libs/pdf/pdf.worker.js";
const pdfjs_workers = new Array(SELECTED_CPU_CORES);
const my_workers = new Array(SELECTED_CPU_CORES);
for (let i = 0; i < SELECTED_CPU_CORES; i++) {
    pdfjs_workers[i] = new pdfjsLib.PDFWorker();
    my_workers[i] = new Worker("/static/scripts/worker.js");
}
let workers_num = SELECTED_CPU_CORES;

const LIMIT = 7;
const A0_WIDTH = 841; const A0_HEIGHT = 1189;
const A1_WIDTH = 594; const A1_HEIGHT = 841;
const A2_WIDTH = 420; const A2_HEIGHT = 594;
const A3_WIDTH = 297; const A3_HEIGHT = 420;
const A4_WIDTH = 210; const A4_HEIGHT = 297;

const formats = ['A4', 'A3', 'A2', 'A1', 'A0', 'НЕФОР'];
const pdf_error_messages = ["Invalid PDF structure.", "The PDF file is empty, i.e. its size is zero bytes."]

const [RESULT] = document.getElementsByClassName('result');
const ERROR1 = document.getElementById("error1");
const ERROR2 = document.getElementById("error2");
const [BODY] = document.getElementsByTagName('body');
const SEND_MESSAGE_CONTAINER = document.getElementById('send-ip');
const SEND_MESSAGE_INPUT = document.getElementById('tmp-franchise-inp');
const SEND_MESSAGE_BUTTON = document.getElementById('tmp-franchise-btn');
const SEND_WRAPPERS = document.querySelectorAll('.send-wrapper');
const PDF_POPUP = document.getElementById('pdf-popup');
const PDF_BUTTON = document.getElementById('info-pdf');
const CPUINPUT = document.getElementById('cores-selector');
const INFO_BUTTON = document.getElementById('info-cpu');
const SPAN1 = document.getElementById('span1');
const INFO_POPUP = document.getElementById('info-popup');

CPUINPUT.max = CPU_CORES;
CPUINPUT.value = String(SELECTED_CPU_CORES);
SPAN1.textContent = 'Потоков обработки: ' + SELECTED_CPU_CORES;

SEND_MESSAGE_BUTTON.addEventListener('click', function() {
    const input_code = SEND_MESSAGE_INPUT.value;
    SEND_WRAPPERS.forEach(function(element) {
        element.remove();
    });
    ERROR2.innerText = 'Отправка...'
    const form = new FormData();
    form.append("key", input_code);
    fetch("/api/specialkey/", {
        method: 'POST',
        body: form
    }).then(function(response) {
        if (response.status === 202) {
            ERROR2.style.color = '#008000';
            ERROR2.innerText = 'Успешно';
        }
        else {
            ERROR2.innerText = "Ошибка запроса к серверу: " + response.status;
        }
    });
});


PDF_BUTTON.addEventListener('mouseover', function() {
    PDF_POPUP.style.display = 'block'; // Показать popup
});

// Скрывать popup при убирании курсора с кнопки
PDF_BUTTON.addEventListener('mouseout', function() {
    PDF_POPUP.style.display = 'none'; // Скрыть popup
});

// Обновление позиции popup относительно мыши
PDF_BUTTON.addEventListener('mousemove', function(event) {
    PDF_POPUP.style.left = event.pageX + 10 + 'px'; // Позиционируем окно справа от курсора
    PDF_POPUP.style.top = event.pageY + 10 + 'px'; // Позиционируем окно ниже курсора
});

function generate_cpu_scroll() {
    // generating cores selector
    const CONT = document.createElement('div');
    CONT.className = 'cont';
    CONT.id = 'cpu';
    const INFO_CONTAINER = document.createElement('div');
    INFO_CONTAINER.className = 'info-container';
    const SPAN1 = document.createElement('span');
    SPAN1.id = 'span1';
    SPAN1.textContent = 'Потоков обработки: ' + SELECTED_CPU_CORES;
    INFO_CONTAINER.appendChild(SPAN1);
    const INFO_BUTTON = document.createElement('button');
    INFO_BUTTON.className = 'info-btn';
    INFO_BUTTON.id = 'info-cpu'
    INFO_BUTTON.innerHTML = 'i'; // Значок "i"
    INFO_CONTAINER.appendChild(INFO_BUTTON); // Добавляем кнопку рядом с SPAN1

    CONT.appendChild(INFO_CONTAINER);
    const SCROLLBAR = document.createElement('div');
    SCROLLBAR.className = 'scrollbar-container';
    const CPUINPUT = document.createElement('input');
    CPUINPUT.type = 'range';
    CPUINPUT.id = 'cores-selector';
    CPUINPUT.min = '1';
    CPUINPUT.max = CPU_CORES;
    CPUINPUT.value = String(SELECTED_CPU_CORES);

    SCROLLBAR.appendChild(CPUINPUT);
    CONT.appendChild(SCROLLBAR);
    const INFO_POPUP = document.createElement('div');
    INFO_POPUP.className = 'popup';
    INFO_POPUP.id = 'info-popup';
    INFO_POPUP.style.display = 'none'; // По умолчанию скрыто
    const SPAN2 = document.createElement('span');
    SPAN2.textContent = 'Сильно ускоряет подсчёт, но повышает нагрузку на ЦП и требует больше ОЗУ';
    INFO_POPUP.appendChild(SPAN2);
    CONT.appendChild(INFO_POPUP);
    RESULT.appendChild(CONT);
    addEventListenersCpuSelectors(CPUINPUT, INFO_BUTTON, SPAN1, INFO_POPUP);
}


function addEventListenersCpuSelectors(CPUINPUT, INFO_BUTTON, SPAN1, INFO_POPUP) {
    CPUINPUT.addEventListener("input", function() {
        console.log(this.value);
        let value = parseInt(this.value);
        SPAN1.textContent = 'Потоков обработки: ' + value;
    });

    CPUINPUT.addEventListener("change", function() {
        let value = parseInt(this.value);
        SELECTED_CPU_CORES = value;
        if (value > workers_num) {
           for (let i = 0; i < value - workers_num; i++) {
            pdfjs_workers[i] = new pdfjsLib.PDFWorker();
            my_workers[i] = new Worker("/static/scripts/worker.js");
            }
            workers_num = value;
        }
        localStorage.setItem("cores", value);
    });

    // Показывать popup при наведении на кнопку "info"
    INFO_BUTTON.addEventListener('mouseover', function() {
        INFO_POPUP.style.display = 'block'; // Показать popup
    });

    // Скрывать popup при убирании курсора с кнопки
    INFO_BUTTON.addEventListener('mouseout', function() {
        INFO_POPUP.style.display = 'none'; // Скрыть popup
    });

    // Обновление позиции popup относительно мыши
    INFO_BUTTON.addEventListener('mousemove', function(event) {
        INFO_POPUP.style.left = event.pageX + 10 + 'px'; // Позиционируем окно справа от курсора
        INFO_POPUP.style.top = event.pageY + 10 + 'px'; // Позиционируем окно ниже курсора
    });
}

addEventListenersCpuSelectors(CPUINPUT, INFO_BUTTON, SPAN1, INFO_POPUP);

pdfInput.addEventListener("change", async function() {
    const files = this.files;
    fileHandler(files);
})

BODY.addEventListener("dragenter", function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add("active");
}, false);


BODY.addEventListener("dragleave", function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove("active");
}, false);


BODY.addEventListener("dragover", function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add("active");
}, false);


BODY.addEventListener("drop", function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove("active");
        const files = e.dataTransfer.files;
        fileHandler(files);
}, false);


window.onload = function() {
    ERROR1.innerText = "";
};


function start_loading() {
    const [DOWNLOAD_TABLE_DEL] = document.getElementsByClassName('download');
    if (DOWNLOAD_TABLE_DEL) {
        document.querySelectorAll('.download').forEach(function(element) {
            element.remove();
        });
        document.getElementsByClassName('price')[0].remove();
    }
    document.getElementById('cpu').remove();
    const [LOADING_DEL] = document.getElementsByClassName('tower');
    if (LOADING_DEL) {
        LOADING_DEL.remove();
        document.getElementsByClassName('message')[0].remove();
        document.getElementsByClassName('progress-bar-container')[0].remove();
        document.getElementsByClassName('loading-tips')[0].remove();
    }

    const LOADING = document.createElement('div');
    LOADING.setAttribute('class', 'tower');
    const TOWER_GROUP = document.createElement('div');
    TOWER_GROUP.setAttribute('class', 'tower__group');
    const colors = ['none', 'red', 'orange', 'purple', 'magenta', 'green', 'white'];
    const random_colors = Array.from({ length: 16 }, () => colors[Math.floor(Math.random() * colors.length)]);
    const repeated_colors = [...random_colors, ...random_colors];
    const moves = ['14', '13', '16', '15', '10', '9', '12', '11', '6', '5', '8', '7', '2', '1', '4', '3']
    // generating cube loading animation
    for (let i = 4; i > -4; i--) {
        const CUR_LAYER = document.createElement('div');
        CUR_LAYER.setAttribute('class', `tower__brick-layer tower__brick-layer--${i}`);
        let start_degree = undefined;
        if (i % 2 == 0) start_degree = 0;
        else start_degree = 45;
        for (let j = 0; j < 4; j++) {
            const CUR_BRICK = document.createElement('div');
            const color = repeated_colors[(i + 4) * 4 - j - 1];
            if (i > 0) CUR_BRICK.setAttribute('class', `tower__brick tower__brick--${90 * j + start_degree} tower__brick--${color}`);
            else CUR_BRICK.setAttribute('class', `tower__brick tower__brick--${90 * j + start_degree} tower__brick--${color} tower__brick--move${moves[-i * 4 + j]}`);
            for (let k = 0; k < 6; k++) {
                let side = undefined;
                if (k < 4) side = 'side';
                else side = 'stud';
                const CUR_SIDE = document.createElement('div');
                CUR_SIDE.setAttribute('class', `tower__brick-${side}`);
                CUR_BRICK.appendChild(CUR_SIDE);
            }
            CUR_LAYER.appendChild(CUR_BRICK);
        }
        TOWER_GROUP.appendChild(CUR_LAYER);
    }
    LOADING.appendChild(TOWER_GROUP);
    const messages = [
        "Загрузка…",
        "Закрываем точку на перерыв пока никого нет…",
        "Брошюруем документ на 1200 страниц…",
        "Считаем каждую страничку максимально точно…",
        "Ждем, пока включится ламинатор…",
        "Подбиваем кассу…",
        "Помогаем клиенту отправить письмо…",
        "Проверяем кассу так же часто, как холодильник дома…"
    ];
    const MESSAGES_CONTAINER = document.createElement('div');
    MESSAGES_CONTAINER.setAttribute('class', 'message');
    for (let i = 0; i < messages.length; i++) {
        const CUR_MESSAGE = document.createElement('p');
        CUR_MESSAGE.setAttribute('class', 'message__line');
        CUR_MESSAGE.innerText = messages[i];
        MESSAGES_CONTAINER.appendChild(CUR_MESSAGE);
    }
    RESULT.appendChild(LOADING);
    RESULT.appendChild(MESSAGES_CONTAINER);

    // generating progress bar
    const PROGRESS_BAR_CONTAINER = document.createElement('div');
    PROGRESS_BAR_CONTAINER.setAttribute('class', 'progress-bar-container');
    const PROGRESS_BAR = document.createElement('div');
    PROGRESS_BAR.setAttribute('class', 'progress-bar');
    PROGRESS_BAR.innerText = '';
    PROGRESS_BAR.style.width = '0%';
    PROGRESS_BAR_CONTAINER.appendChild(PROGRESS_BAR);
    const LOADING_TIPS = document.createElement('div');
    LOADING_TIPS.setAttribute('class', 'loading-tips');
    RESULT.appendChild(PROGRESS_BAR_CONTAINER);
    RESULT.appendChild(LOADING_TIPS);
}


async function fileHandler(files) {
    // validating account
    {
        const response = await fetch("/api/check/account/");
        if (response.ok) {
            const text = await response.text();
            if (text === "Not authenticated") {
                ERROR1.innerText = "Вы не авторизованы. Пожалуйста, войдите в аккаунт.";
                return false;
            }
            else if (text === "PC limit") {
                ERROR1.innerText = "К сожалению, достигнут лимит активных ПК.";
                return false;
            }
            else if (text === "Sub is expired") {
                ERROR1.innerText = "Подписка не активирована.";
                return false;
            }
            else if (text === "PC limit") {
                ERROR1.innerText = "К сожалению, достигнут лимит активных ПК.";
                return false;
            }
        }
        else {
            ERROR1.innerText = "Ошибка запроса к серверу: " + response.status;
            return false;
        }
    }
    // validating file
    let docx_promises = new Array(files.length);
    let docx_count = 0;
    let pdf_files_ind = new Array();
    if (files.length === 0) return false;
    for (let file_ind = 0; file_ind < files.length; file_ind++) {
        if (files[file_ind]) {
            const file_type = files[file_ind].name.split(".").pop().toLowerCase();
            if (file_type === "doc" || file_type === "docx") {
                docx_promises[file_ind] = (fetch("/api/docxToPdf/", {
                    method: 'POST',
                    body: files[file_ind]
                }).then(function(response) {
                    return {response, file_ind}
                }));
                docx_count++;
            }
            else if (file_type === "pdf") {
                docx_promises[file_ind] = new Promise(function() {});
                pdf_files_ind.push(file_ind);
            }
            else {
                ERROR1.innerText = "Пожалуйста, выберите PDF/DOC/DOCX файл >:(";
                return false;
            }
        }
        else {
            ERROR1.innerText = "Пожалуйста, выберите PDF/DOC/DOCX файл >:(";
            return false;
        }
    }
    ERROR1.innerText = "";
    let errors_set = new Set();
    start_loading();
    let parsed_files_num = 0;

    // init output pdf info
    let page_types = new Array(6); // 0 - A4, 1 - A3, 2 - A2, 3 - A1, 4 - A0, 5 - not format
    for (let i = 0; i < 6; i++) page_types[i] = new Array(3).fill(0); // 0 - grayscale, 1 - color (stage 1), 2 - color (stage 2)
    let page_downloads = new Array(6); // 0 - A4, 1 - A3, 2 - A2, 3 - A1, 4 - A0, 5 - not format
    for (let format_ind = 0; format_ind < 6; format_ind++) {
        page_downloads[format_ind] = new Array(2); // 0 - grayscale, 1 - color
        for (let color_ind = 0; color_ind < 2; color_ind++){
            page_downloads[format_ind][color_ind] = new Array(files.length);
            for (let file_ind = 0; file_ind < files.length; file_ind++) {
                page_downloads[format_ind][color_ind][file_ind] = new Array();
            }
        }
    }
    let page_black_list = new Array(files.length);
    for (let file_ind = 0; file_ind < files.length; file_ind++) {
        page_black_list[file_ind] = new Array();
    }

    async function parsePdf(file_data, file_ind) {
        const [PROGRESS_BAR] = document.getElementsByClassName('progress-bar');
        const [LOADING_TIPS] = document.getElementsByClassName('loading-tips');
        LOADING_TIPS.innerText = `${files[file_ind].name} ${++parsed_files_num}/${files.length}`

        let page_ind = 0;
        let pages_count;
        const pdfs = new Array();
        file_data = new Uint8Array(file_data);
        if (SELECTED_CPU_CORES > 1) {
            {
                const copy_file_data = new Uint8Array(new ArrayBuffer(file_data.length))
                copy_file_data.set(file_data);
                const doc = await pdfjsLib.getDocument({ data: copy_file_data, worker: pdfjs_workers[0] }).promise;
                pages_count = doc.numPages;
                pdfs.push(new Promise(function(resolve) {
                    start(doc, my_workers[0], resolve);
                }));
            }
            const need_threads = Math.min(SELECTED_CPU_CORES, pages_count);
            if (need_threads > 1) {
                for (let i = 2; i < need_threads; i++){
                    const copy_file_data = new Uint8Array(new ArrayBuffer(file_data.length))
                    copy_file_data.set(file_data);
                    pdfs.push(pdfjsLib.getDocument({ data: copy_file_data, worker: pdfjs_workers[i] }).promise.then(async function(doc) {
                        await new Promise(function(resolve) {
                            start(doc, my_workers[i], resolve);
                        });
                    }));
                }
                pdfs.push(pdfjsLib.getDocument({ data: file_data, worker: pdfjs_workers[1] }).promise.then(async function(doc) {
                    await new Promise(function(resolve) {
                        start(doc, my_workers[1], resolve);
                    });
                }));
            }
        }
        else {
            pdfs.push(pdfjsLib.getDocument({ data: file_data, worker: pdfjs_workers[0] }).promise.then(async function(doc) {
                pages_count = doc.numPages;
                await new Promise(function(resolve) {
                    start(doc, my_workers[0], resolve);
                });
            }));
        }
        await Promise.all(pdfs);

        async function start(doc, worker, resolve) {
            const render_page_ind = page_ind++;
            if (render_page_ind >= pages_count) {
                doc.destroy();
                resolve();
                return;
            }

            const page = await doc.getPage(render_page_ind + 1);

            // get page size
            const page_rect = page.view;
            let format_width = (page_rect[2] - page_rect[0]) * 0.3527722110322778;
            let format_height = (page_rect[3] - page_rect[1]) * 0.3527722110322778;
            if (format_width > format_height) {
                const tmp = format_height;
                format_height = format_width;
                format_width = tmp;
            }

            if (format_width > 910) {
                page_black_list[file_ind].push(render_page_ind);

                page._destroy();
                doc._transport.pageCache.clear();
                doc._transport.pagePromises.clear();
                start(doc, worker, resolve);
            }
            else {
                // transform page to image
                const viewport = page.getViewport({scale: 0.5});
                const image_width = Math.floor(viewport.width);
                const image_height = Math.floor(viewport.height);
                const ctx = new OffscreenCanvas(image_width, image_height).getContext("2d");
                const render = page.render({canvasContext: ctx, viewport: viewport});
                // save image if need it
                // canvas.toBlob(function (blob) {
                //     const link = document.createElement("a");
                //     link.download = "page-" + page_ind + ".bmp";
                //     link.href = URL.createObjectURL(blob);
                //     link.click();
                // }, "image/bmp");

                // get page format from size
                let format;
                format_width -= LIMIT;
                format_height -= LIMIT;
                if (format_width < A4_WIDTH && format_height < A4_HEIGHT) format = 0;
                else if (format_width < A3_WIDTH && format_height < A3_HEIGHT) format = 1;
                else if (format_width < A2_WIDTH && format_height < A2_HEIGHT) format = 2;
                else if (format_width < A1_WIDTH && format_height < A1_HEIGHT) format = 3;
                else if (format_width < A0_WIDTH && format_height < A0_HEIGHT) format = 4;
                else format = 5;

                await render.renderTask.promise;
                const pixels_data = ctx.getImageData(0, 0, image_width, image_height).data;
                worker.onmessage = async function(event) {
                    const color = event.data;
                    if (format < 2) { // A4 and A3
                        if (color === 0) {
                            page_types[format][0]++;
                            page_downloads[format][0][file_ind].push(render_page_ind);
                        }
                        else if (color < 50) {
                            page_types[format][1]++;
                            page_downloads[format][1][file_ind].push(render_page_ind);
                        }
                        else {
                            page_types[format][2]++;
                            page_downloads[format][1][file_ind].push(render_page_ind);
                        }
                    }
                    else if (format < 5) {  // A2 and A1 and A0
                        if (color === 0) {
                            page_types[format][0]++;
                            page_downloads[format][0][file_ind].push(render_page_ind);
                        }
                        else if (color < 15) {
                            page_types[format][1]++;
                            page_downloads[format][1][file_ind].push(render_page_ind);
                        }
                        else if (color < 50) {
                            page_types[format][2]++;
                            page_downloads[format][1][file_ind].push(render_page_ind);
                        }
                        else page_black_list[file_ind].push(render_page_ind);
                    }
                    else {  // unformat
                        if (color === 0) {
                            page_types[format][0] += (format_height + LIMIT) / 1000;
                            page_downloads[format][0][file_ind].push(render_page_ind);
                        }
                        else if (color < 15) {
                            page_types[format][1] += (format_height + LIMIT) / 1000;
                            page_downloads[format][1][file_ind].push(render_page_ind);
                        }
                        else if (color < 50) {
                            page_types[format][2] += (format_height + LIMIT) / 1000;
                            page_downloads[format][1][file_ind].push(render_page_ind);
                        }
                        else page_black_list[file_ind].push(render_page_ind);
                    }
                    // setting progress at progress bar
                    const cur_percent = Math.min(Math.round(page_ind / pages_count * 100), 100) + '%';
                    PROGRESS_BAR.innerText = cur_percent;
                    PROGRESS_BAR.style.width = cur_percent;

                    page._destroy();
                    doc._transport.pageCache.clear();
                    doc._transport.pagePromises.clear();
                    start(doc, worker, resolve);
                }
                worker.postMessage({image_width, image_height, pixels_data}, [pixels_data.buffer]);
            }
        }
    }


    for (let i = 0; i < pdf_files_ind.length; i++) {
        await parsePdf(await files[pdf_files_ind[i]].arrayBuffer(), pdf_files_ind[i]);
    }
    let new_files = new Array(files.length);
    {
        let finish_count = 0
        while (finish_count !== docx_count) {
            const data = await Promise.race(docx_promises);
            docx_promises[data.file_ind] = new Promise(function() {});
            if (data.response.ok) {
                new_files[data.file_ind] = await data.response.blob();
                new_files[data.file_ind].name = files[data.file_ind].name;
                await parsePdf(await new_files[data.file_ind].arrayBuffer(), data.file_ind);
                finish_count++
            }
            else {
                console.log("bruh");
            }
        }
    }


    // clear loading
    document.getElementsByClassName('tower')[0].remove();
    document.getElementsByClassName('message')[0].remove();
    document.getElementsByClassName('progress-bar-container')[0].remove();
    document.getElementsByClassName('loading-tips')[0].remove();

    // create download table
    let input_pdfs = new Array(files.length);
    let encrypted_only = true;
    for (let file_ind = 0; file_ind < files.length; file_ind++) {
        try {
            if (pdf_files_ind.includes(file_ind)) input_pdfs[file_ind] = await PDFLib.PDFDocument.load(await files[file_ind].arrayBuffer());
            else input_pdfs[file_ind] = await PDFLib.PDFDocument.load(await new_files[file_ind].arrayBuffer());
            encrypted_only = false;
        }
        catch (err) {
            if (err.message === "Input document to `PDFDocument.load` is encrypted. You can use `PDFDocument.load(..., { ignoreEncryption: true })` if you wish to load the document anyways.") {
                // encrypted table generation
                input_pdfs[file_ind] = 'encrypted';
                const ENCRYPTED_TABLE = document.createElement('table');
                ENCRYPTED_TABLE.setAttribute('class', 'download');
                const ENCRYPTED_CAP = document.createElement('caption');
                ENCRYPTED_CAP.innerText = files[file_ind].name + ' (номера листов)';
                ENCRYPTED_TABLE.appendChild(ENCRYPTED_CAP);
                 {
                    const ENCRYPTED_CUR_TR = document.createElement('tr');
                    ENCRYPTED_CUR_TR.appendChild(document.createElement('th'));
                    for (let i = 0; i < 6; i++) {
                        const ENCRYPTED_CUR_TH = document.createElement('th');
                        ENCRYPTED_CUR_TH.innerText = formats[i];
                        ENCRYPTED_CUR_TR.appendChild(ENCRYPTED_CUR_TH);
                    }
                    ENCRYPTED_TABLE.appendChild(ENCRYPTED_CUR_TR);
                }
                for (let i = 0; i < 2; i++){
                    const ENCRYPTED_CUR_TR = document.createElement('tr');
                    const ENCRYPTED_CUR_TD = document.createElement('td');
                    if (i === 0) ENCRYPTED_CUR_TD.innerText = 'Черно-белое';
                    else ENCRYPTED_CUR_TD.innerText = 'Цветное';
                    ENCRYPTED_CUR_TR.appendChild(ENCRYPTED_CUR_TD);
                        for (let j = 0; j < 6; j++) {
                            const CUR_PAGE_NUMS = document.createElement('td');
                            if (page_downloads[j][i][file_ind].length) {
                                let compareFn = (a, b) => a - b;
                                page_downloads[j][i][file_ind].sort(compareFn);
                                CUR_PAGE_NUMS.innerText = page_downloads[j][i][file_ind][0] + 1;
                                for (let page = 1; page < page_downloads[j][i][file_ind].length; page++) CUR_PAGE_NUMS.innerText += `, ${page_downloads[j][i][file_ind][page] + 1}`;
                            }
                            ENCRYPTED_CUR_TR.appendChild(CUR_PAGE_NUMS);
                        }
                        ENCRYPTED_TABLE.appendChild(ENCRYPTED_CUR_TR);
                    }
                RESULT.appendChild(ENCRYPTED_TABLE);
                errors_set.add("Часть файлов зашифрована.");
            }
            else console.log(err);
        }
    }
    if (!encrypted_only){
    const DOWNLOAD_TABLE = document.createElement('table');
    DOWNLOAD_TABLE.setAttribute('class', 'download');
    const DOWNLOAD_CAP = document.createElement('caption');
    DOWNLOAD_CAP.innerText = 'Скачать файлы';
    DOWNLOAD_TABLE.appendChild(DOWNLOAD_CAP);
    {
        const DOWNLOAD_CUR_TR = document.createElement('tr');
        DOWNLOAD_CUR_TR.appendChild(document.createElement('th'));
        for (let i = 0; i < 6; i++) {
            const DOWNLOAD_CUR_TH = document.createElement('th');
            DOWNLOAD_CUR_TH.innerText = formats[i];
            DOWNLOAD_CUR_TR.appendChild(DOWNLOAD_CUR_TH);
        }
        DOWNLOAD_TABLE.appendChild(DOWNLOAD_CUR_TR);
    }
    for (let i = 0; i < 2; i++){
        const DOWNLOAD_CUR_TR = document.createElement('tr');
        const DOWNLOAD_CUR_TD = document.createElement('td');
        if (i === 0) DOWNLOAD_CUR_TD.innerText = 'Черно-белое';
        else DOWNLOAD_CUR_TD.innerText = 'Цветное';
        DOWNLOAD_CUR_TR.appendChild(DOWNLOAD_CUR_TD);
        for (let j = 0; j < 6; j++) {
            const CUR_DOWNLOAD = document.createElement('td');
            for (let file_ind = 0; file_ind < files.length; file_ind++) {
                if (page_downloads[j][i][file_ind].length) {
                    const CUR_BUTTON = document.createElement('button');
                    CUR_BUTTON.innerText = formats[j];
                    CUR_BUTTON.addEventListener('click', async function () {
                        // assembling new pdf
                        const new_pdf = await PDFLib.PDFDocument.create();
                        for (let file_ind = 0; file_ind < files.length; file_ind++) {
                            if (page_downloads[j][i][file_ind].length && input_pdfs[file_ind] != 'encrypted') {
                                const copied_pages = await new_pdf.copyPages(input_pdfs[file_ind], page_downloads[j][i][file_ind]);
                                for (let page = 0; page < page_downloads[j][i][file_ind].length; page++) await new_pdf.addPage(copied_pages[page]);
                            }
                        }
                        // download new pdf
                        const blob = new Blob([await new_pdf.save()]);
                        const A = document.createElement('a');
                        A.href = URL.createObjectURL(blob);
                        if (i === 0) a.download = 'ЧБ ' + formats[j] + '.pdf';
                        else a.download = 'ЦВ ' + formats[j] + '.pdf';
                        A.click();
                        URL.revokeObjectURL(A.href);
                    });
                    CUR_DOWNLOAD.appendChild(CUR_BUTTON);
                    break
                }
            }
            DOWNLOAD_CUR_TR.appendChild(CUR_DOWNLOAD);
        }
        DOWNLOAD_TABLE.appendChild(DOWNLOAD_CUR_TR);
    }
    RESULT.appendChild(DOWNLOAD_TABLE);
    }


    // create price table
    for (let i = 0; i < 3; i++) page_types[5][i] = Math.round(page_types[5][i] * 100) / 100;
    const PRICE_TABLE = document.createElement('table');
    PRICE_TABLE.setAttribute('class', 'price');
    const PRICE_CAP = document.createElement('caption');
    PRICE_CAP.innerText = 'Стоимость';
    PRICE_TABLE.appendChild(PRICE_CAP);
    {
        const PRICE_CUR_TR = document.createElement('tr');
        PRICE_CUR_TR.appendChild(document.createElement('th'));
        for (let j = 0; j < 6; j++) {
            const PRICE_CUR_TH = document.createElement('th');
            PRICE_CUR_TH.innerText = formats[j];
            PRICE_CUR_TR.appendChild(PRICE_CUR_TH);
        }
        PRICE_TABLE.appendChild(PRICE_CUR_TR);
    }
    let result_price = 0;
    for (let i = 0; i < 3; i++) {
        const PRICE_CUR_TR = document.createElement('tr');
        const PRICE_CUR_TD = document.createElement('td');
        if (i === 0) PRICE_CUR_TD.innerText = 'Черно-белое';
        else if (i === 1) PRICE_CUR_TD.innerText = 'Заливка до 50% (до 15% у неформат.)';
        else {
            PRICE_CUR_TD.innerText = 'Заливка до 100% (до 50% у неформат.)';
            fetch("/api/check/finish/", {method: 'POST'});  // самое место)))
        }
        PRICE_CUR_TR.appendChild(PRICE_CUR_TD);
        for (let j = 0; j < 6; j++) {
            const CUR_PRICE = document.createElement('td');
            const cur_num = page_types[j][i];
            let cur_type_pages;
            if (i !== 0) {cur_type_pages = page_types[j][1] + page_types[j][2];}
            else {cur_type_pages = page_types[j][i];}
            if (cur_num) {
                let price;
                if (j < 2) {
                    const cur_nums = [6, 11, 21, 51, 101, 301, cur_type_pages + 1];
                    for (let num = 0; num < 7; num++) {
                        if (cur_type_pages < cur_nums[num]){
                            price = PRICES[j][i][num];
                            break;
                        }
                    }
                }
                else if (i === 0) {
                    const cur_nums = [2, 6, 11, 21, 51, cur_type_pages + 1];
                    for (let num = 0; num < 6; num++) {
                        if (cur_type_pages < cur_nums[num]){
                            price = PRICES[j][i][num];
                            break;
                        }
                    }
                }
                else {
                    const cur_nums = [2, 6, 11, 21, 51, 101, cur_type_pages + 1];
                    for (let num = 0; num < 7; num++) {
                        if (cur_type_pages < cur_nums[num]){
                            price = PRICES[j][i][num];
                            break;
                        }
                    }
                }
                CUR_PRICE.innerText = `${cur_num} * `;
                const CUR_COST_INPUT = document.createElement('input');
                CUR_COST_INPUT.type = 'number';
                CUR_COST_INPUT.min = '0';
                CUR_COST_INPUT.value = price;
                let previous_cost = price;

                CUR_COST_INPUT.addEventListener('input', function() {
                    let value = parseInt(this.value);
                    if (value < CUR_COST_INPUT.min || isNaN(value)) {
                        value = CUR_COST_INPUT.min;
                    }
                    CUR_COST_INPUT.value = value;
                    result_price -= (previous_cost - value) * cur_num;
                    previous_cost = value;
                    document.getElementById('textspan1').innerText = `${result_price.toFixed(2)}₽ * Скидка `;
                    document.getElementById('textspan2').innerText = `% = ${(result_price * (100 - document.getElementById('value-discount').value) / 100).toFixed(2)}₽`;
                });

                CUR_PRICE.appendChild(CUR_COST_INPUT);
                result_price += cur_num * price;
            }
            PRICE_CUR_TR.appendChild(CUR_PRICE);
        }
        PRICE_TABLE.appendChild(PRICE_CUR_TR);
    }

    {
        const PRICE_RES_TR = document.createElement('tr');
        {
            const PRICE_RES_TD = document.createElement('td');
            PRICE_RES_TD.setAttribute('colspan', '6');
            PRICE_RES_TD.innerText = 'Итого:';
            PRICE_RES_TD.style.textAlign = 'right';
            PRICE_RES_TR.appendChild(PRICE_RES_TD);
        }
        {
            const PRICE_RES_TD = document.createElement('td');

            // generating discount
            const DISCOUNT_SPAN = document.createElement('span');
            const TEXT_SPAN1 = document.createElement('span');
            TEXT_SPAN1.innerText = `${result_price.toFixed(2)}₽ * Скидка `;
            TEXT_SPAN1.id = 'textspan1'
            DISCOUNT_SPAN.appendChild(TEXT_SPAN1);
            DISCOUNT_SPAN.id = 'discountspan';
            const DISCOUNT_INPUT = document.createElement('input');
            DISCOUNT_INPUT.type = 'number';
            DISCOUNT_INPUT.id = 'value-discount';
            DISCOUNT_INPUT.min = '0';
            DISCOUNT_INPUT.max = '100';
            DISCOUNT_INPUT.value = '0';
            const TEXT_SPAN2 = document.createElement('span');
            TEXT_SPAN2.innerText = `% = ${(result_price * (100 - DISCOUNT_INPUT.value) / 100).toFixed(2)}₽`;
            TEXT_SPAN2.id = 'textspan2'
            DISCOUNT_SPAN.appendChild(DISCOUNT_INPUT);
            DISCOUNT_SPAN.appendChild(TEXT_SPAN2);
            PRICE_RES_TD.appendChild(DISCOUNT_SPAN);
            PRICE_RES_TR.appendChild(PRICE_RES_TD);

            DISCOUNT_INPUT.addEventListener('input', function() {
                let value = parseInt(this.value);
                if (value < DISCOUNT_INPUT.min) {
                    value = DISCOUNT_INPUT.min;
                }
                if (value > DISCOUNT_INPUT.max) {
                    value = DISCOUNT_INPUT.max;
                }
                DISCOUNT_INPUT.value = value;
                TEXT_SPAN2.innerText = `% = ${(result_price * (100 - value) / 100).toFixed(2)}₽`
            });
        }
        PRICE_TABLE.appendChild(PRICE_RES_TR);
    }
    RESULT.appendChild(PRICE_TABLE);
    let black_list_flag = false;
    page_black_list.forEach(function(file) {
        if (file.length) black_list_flag = true;
    });
    if (black_list_flag) {
        errors_set.add('Часть листов попала в черный список.')
        // black_list table generation
        const BLACK_LIST_TABLE = document.createElement('table');
        BLACK_LIST_TABLE.setAttribute('class', 'download');
        const BLACK_LIST_CAP = document.createElement('caption');
        BLACK_LIST_CAP.innerText = 'Черный список (документы > 900мм / широкоформатные со слишком большой зиливкой)';
        BLACK_LIST_TABLE.appendChild(BLACK_LIST_CAP);
        {
            const BLACK_LIST_CUR_TR = document.createElement('tr');
            const BLACK_LIST_CUR_TH1 = document.createElement('th');
            BLACK_LIST_CUR_TH1.innerText = 'Название файла';
            BLACK_LIST_CUR_TR.appendChild(BLACK_LIST_CUR_TH1);
            const BLACK_LIST_CUR_TH2 = document.createElement('th');
            BLACK_LIST_CUR_TH2.innerText = 'Скачать страницы';
            BLACK_LIST_CUR_TR.appendChild(BLACK_LIST_CUR_TH2);
            BLACK_LIST_TABLE.appendChild(BLACK_LIST_CUR_TR);
        }
        for (let file_ind = 0; file_ind < page_black_list.length; file_ind++){
            if (page_black_list[file_ind].length) {
                const BLACK_LIST_CUR_TR = document.createElement('tr');
                const BLACK_LIST_CUR_TD = document.createElement('td');
                BLACK_LIST_CUR_TD.innerText = files[file_ind].name;
                BLACK_LIST_CUR_TR.appendChild(BLACK_LIST_CUR_TD);
                const CUR_DOWNLOAD = document.createElement('td');

                const CUR_BUTTON = document.createElement('button');
                CUR_BUTTON.innerText = 'Скачать';
                CUR_BUTTON.addEventListener('click', async function () {
                    // assembling new pdf
                    const new_pdf = await PDFLib.PDFDocument.create();
                    const copied_pages = await new_pdf.copyPages(input_pdfs[file_ind], page_black_list[file_ind]);
                    for (let page = 0; page < page_black_list[file_ind].length; page++) await new_pdf.addPage(copied_pages[page]);
                    // download new pdf
                    const blob = new Blob([await new_pdf.save()]);
                    const A = document.createElement('a');
                    A.href = URL.createObjectURL(blob);
                    A.download = `ЧС ${files[file_ind].name}`;
                    A.click();
                    URL.revokeObjectURL(A.href);
                });
                CUR_DOWNLOAD.appendChild(CUR_BUTTON);
                BLACK_LIST_CUR_TR.appendChild(CUR_DOWNLOAD);
                BLACK_LIST_TABLE.appendChild(BLACK_LIST_CUR_TR);
            }
        }
        RESULT.appendChild(BLACK_LIST_TABLE);
    }
    errors_set.forEach(function(error) {
        ERROR1.innerText += ` ${error} `;
    });

    generate_cpu_scroll();
}
