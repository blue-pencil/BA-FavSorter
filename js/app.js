let TOTAL_CHARACTERS = 180;
const MAX_RANK_DISPLAY = 30;
let masterList = [];
let listArr = [];
let parentListArr = [];
let leftArr = [];
let rightArr = [];
let leftIndex = 0;
let rightIndex = 0;
let mergedArr = [];
let eliminatedList = [];
let historyStack = [];
let currentLeft = null;
let currentRight = null;
let totalMatchEstimate = 0;
let currentMatchCount = 0;
const screenIntro = document.getElementById('screen-intro');
const screenInstruction = document.getElementById('screen-instruction');
const screenMain = document.getElementById('screen-main');
const screenResult = document.getElementById('screen-result');
const btnStart = document.getElementById('btn-start');
const btnLoad = document.getElementById('btn-load');
const btnBeginSort = document.getElementById('btn-begin-sort');
const btnRestart = document.getElementById('btn-restart');
const btnUndo = document.getElementById('btn-undo');
const btnDraw = document.getElementById('btn-draw');
const btnHome = document.getElementById('btn-home');
const btnLoadHash = document.getElementById('btn-load-hash');
const btnCopyHash = document.getElementById('btn-copy-hash');
const btnDownload = document.getElementById('btn-download');
const SAVE_KEY = 'favsorter_save_data';
const MAX_HISTORY = 30;
const progressBarFill = document.getElementById('progress-bar-fill');
const currentMatchInfo = document.getElementById('current-match-info');
const progressPercentage = document.getElementById('progress-percentage');
const cardLeft = document.getElementById('card-left');
const imgLeft = document.getElementById('img-left');
const btnIgnoreLeft = document.getElementById('btn-ignore-left');
const cardRight = document.getElementById('card-right');
const imgRight = document.getElementById('img-right');
const btnIgnoreRight = document.getElementById('btn-ignore-right');
const rankingList = document.getElementById('ranking-list');
let userLang = (navigator.language || navigator.userLanguage).split('-')[0];
if (userLang !== 'ko' && userLang !== 'ja') {
    userLang = 'en';
}
function t(key) {
    if (typeof i18n === 'undefined') return key;
    return i18n[userLang][key] || i18n['ko'][key] || key;
}
function applyTranslations() {
    document.documentElement.lang = userLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerHTML = t(el.getAttribute('data-i18n'));
    });
}
function generateData() {
    const list = [];
    if (typeof dataSet !== 'undefined' && typeof dataSetVersion !== 'undefined') {
        const charData = dataSet[dataSetVersion].characterData;
        TOTAL_CHARACTERS = charData.length;
        for (let i = 0; i < charData.length; i++) {
            list.push({
                id: i + 1,
                name: charData[i].name,
                image: `assets/img/characters/${charData[i].img}`
            });
        }
    }
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}
function switchScreen(activeScreen) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        setTimeout(() => s.classList.add('hidden'), 300);
    });
    setTimeout(() => {
        activeScreen.classList.remove('hidden');
        setTimeout(() => activeScreen.classList.add('active'), 10);
    }, 300);
}
btnStart.addEventListener('click', () => {
    if (localStorage.getItem(SAVE_KEY)) {
        if (!confirm(t('confirm_new'))) {
            return;
        }
    }
    switchScreen(screenInstruction);
});
btnLoad.addEventListener('click', loadGameState);
btnBeginSort.addEventListener('click', initSort);
btnRestart.addEventListener('click', () => {
    switchScreen(screenIntro);
});
btnDownload.addEventListener('click', () => {
    const originalText = btnDownload.textContent;
    btnDownload.textContent = t('btn_saving');
    btnDownload.disabled = true;
    html2canvas(document.querySelector('.container'), {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        btnDownload.textContent = originalText;
        btnDownload.disabled = false;
        const link = document.createElement('a');
        link.download = 'BA_CharacterSorter_Result.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(err => {
        console.error("html2canvas error:", err);
        btnDownload.textContent = originalText;
        btnDownload.disabled = false;
        alert(t('alert_img_err'));
    });
});
btnHome.addEventListener('click', () => {
    if (confirm(t('confirm_home'))) {
        switchScreen(screenIntro);
    }
});
function initSort() {
    masterList = generateData();
    listArr = masterList.map(c => [c]);
    parentListArr = [];
    leftArr = [];
    rightArr = [];
    leftIndex = 0;
    rightIndex = 0;
    mergedArr = [];
    eliminatedList = [];
    historyStack = [];
    currentMatchCount = 0;
    totalMatchEstimate = getEstimatedRemaining();
    switchScreen(screenMain);
    setupNextMatch();
}
function saveGameState() {
    if (!currentLeft || !currentRight) return;
    const state = {
        masterList,
        listArr,
        parentListArr,
        leftArr,
        rightArr,
        leftIndex,
        rightIndex,
        mergedArr,
        eliminatedList,
        historyStack,
        currentLeft,
        currentRight,
        totalMatchEstimate,
        currentMatchCount
    };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Failed to save state to localStorage', e);
    }
}
function loadGameState() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (!saved) {
            alert(t('err_no_save'));
            return;
        }
        const state = JSON.parse(saved);
        masterList = state.masterList;
        listArr = state.listArr;
        parentListArr = state.parentListArr;
        leftArr = state.leftArr;
        rightArr = state.rightArr;
        leftIndex = state.leftIndex;
        rightIndex = state.rightIndex;
        mergedArr = state.mergedArr;
        eliminatedList = state.eliminatedList;
        historyStack = state.historyStack || [];
        currentLeft = state.currentLeft;
        currentRight = state.currentRight;
        totalMatchEstimate = state.totalMatchEstimate;
        currentMatchCount = state.currentMatchCount;
        switchScreen(screenMain);
        renderMatch();
        updateProgress();
    } catch (e) {
        alert(t('err_load'));
        console.error(e);
    }
}
function encodeStateForHash() {
    if (!currentLeft || !currentRight) return null;
    const ids = arr => arr.map(c => c.id);
    const ids2 = arr2 => arr2.map(arr => ids(arr));
    const state = {
        m: masterList.map(c => c.id),
        la: ids2(listArr),
        pa: ids2(parentListArr),
        l: ids(leftArr),
        r: ids(rightArr),
        li: leftIndex,
        ri: rightIndex,
        ma: ids(mergedArr),
        e: ids(eliminatedList),
        cl: currentLeft ? currentLeft.id : null,
        cr: currentRight ? currentRight.id : null,
        cnt: currentMatchCount,
        tot: totalMatchEstimate
    };
    return btoa(JSON.stringify(state));
}
function decodeStateFromHash(hash) {
    const state = JSON.parse(atob(hash));
    let fullChars = {};
    if (typeof dataSet !== 'undefined' && typeof dataSetVersion !== 'undefined') {
        const charData = dataSet[dataSetVersion].characterData;
        charData.forEach((cd, i) => {
            fullChars[i + 1] = {
                id: i + 1,
                name: cd.name,
                image: `assets/img/characters/${cd.img}`
            };
        });
    }
    const expandChar = id => fullChars[id] || { id: id, name: "Unknown", image: "" };
    const expandCharArr = arr => arr.map(expandChar);
    const expandCharArr2 = arr2 => arr2.map(expandCharArr);
    masterList = state.m.map(expandChar);
    listArr = expandCharArr2(state.la);
    parentListArr = expandCharArr2(state.pa);
    leftArr = expandCharArr(state.l);
    rightArr = expandCharArr(state.r);
    leftIndex = state.li;
    rightIndex = state.ri;
    mergedArr = expandCharArr(state.ma);
    eliminatedList = expandCharArr(state.e);
    currentLeft = state.cl ? expandChar(state.cl) : null;
    currentRight = state.cr ? expandChar(state.cr) : null;
    currentMatchCount = state.cnt;
    totalMatchEstimate = state.tot;
    historyStack = [];
}
btnLoadHash.addEventListener('click', () => {
    const hash = prompt(t('prompt_hash'));
    if (!hash) return;
    try {
        decodeStateFromHash(hash);
        switchScreen(screenMain);
        renderMatch();
        updateProgress();
        saveGameState();
        alert(t('alert_load_ok'));
    } catch (e) {
        alert(t('alert_load_err'));
        console.error(e);
    }
});
btnCopyHash.addEventListener('click', () => {
    const hash = encodeStateForHash();
    if (!hash) {
        alert(t('alert_no_hash'));
        return;
    }
    navigator.clipboard.writeText(hash).then(() => {
        alert(t('alert_copy_ok'));
    }).catch(err => {
        prompt(t('prompt_copy_fail'), hash);
    });
});
function getEstimatedRemaining() {
    let lengths = [];
    for (let arr of listArr) lengths.push(arr.length);
    let nextPassLengths = [];
    for (let arr of parentListArr) nextPassLengths.push(arr.length);
    let cLeft = (leftArr && leftIndex < leftArr.length) ? leftArr.length - leftIndex : 0;
    let cRight = (rightArr && rightIndex < rightArr.length) ? rightArr.length - rightIndex : 0;
    let totalMax = 0;
    if (cLeft > 0 || cRight > 0) {
        let maxComp = cLeft + cRight - 1;
        totalMax += (maxComp > 0 ? maxComp : 0);
        nextPassLengths.push(cLeft + cRight);
    }
    let currentPass = [...lengths];
    let nextPass = [...nextPassLengths];
    while (currentPass.length + nextPass.length > 1) {
        if (currentPass.length === 0) {
            currentPass = nextPass;
            nextPass = [];
        }
        if (currentPass.length >= 2) {
            let a = currentPass.shift();
            let b = currentPass.shift();
            totalMax += (a + b - 1);
            nextPass.push(a + b);
        } else if (currentPass.length === 1) {
            nextPass.push(currentPass.shift());
        }
    }
    return Math.max(0, Math.floor(totalMax * 0.88));
}
function updateProgress() {
    const remainingMatches = getEstimatedRemaining();
    const displayMatchNum = currentMatchCount + 1;
    const totalEst = currentMatchCount + remainingMatches;
    const percent = totalEst === 0 ? 100 : Math.min(Math.round((currentMatchCount / totalEst) * 100), 99);
    if (typeof getMatchInfoText === 'function') {
        currentMatchInfo.textContent = getMatchInfoText(userLang, displayMatchNum, remainingMatches);
    } else {
        currentMatchInfo.textContent = `${displayMatchNum}번째 선택 (남은 예상: ${remainingMatches}번)`;
    }
    progressPercentage.textContent = `${percent}%`;
    progressBarFill.style.width = `${percent}%`;
}
function saveHistory() {
    const state = {
        listArr: JSON.parse(JSON.stringify(listArr)),
        parentListArr: JSON.parse(JSON.stringify(parentListArr)),
        leftArr: JSON.parse(JSON.stringify(leftArr)),
        rightArr: JSON.parse(JSON.stringify(rightArr)),
        leftIndex,
        rightIndex,
        mergedArr: JSON.parse(JSON.stringify(mergedArr)),
        eliminatedList: JSON.parse(JSON.stringify(eliminatedList)),
        currentLeft: JSON.parse(JSON.stringify(currentLeft)),
        currentRight: JSON.parse(JSON.stringify(currentRight)),
        currentMatchCount
    };
    historyStack.push(state);
    if (historyStack.length > MAX_HISTORY) {
        historyStack.shift();
    }
}
function setupNextMatch() {
    if (leftArr.length > 0 && rightArr.length > 0) {
        if (leftIndex >= leftArr.length || rightIndex >= rightArr.length) {
            if (leftIndex < leftArr.length) {
                mergedArr.push(...leftArr.slice(leftIndex));
            } else if (rightIndex < rightArr.length) {
                mergedArr.push(...rightArr.slice(rightIndex));
            }
            parentListArr.push(mergedArr);
            leftArr = [];
            rightArr = [];
            mergedArr = [];
            leftIndex = 0;
            rightIndex = 0;
        }
    }
    if (leftArr.length === 0 && rightArr.length === 0) {
        if (listArr.length >= 2) {
            leftArr = listArr.shift();
            rightArr = listArr.shift();
            leftIndex = 0;
            rightIndex = 0;
        } else if (listArr.length === 1) {
            parentListArr.push(listArr.shift());
        }
    }
    if (leftArr.length === 0 && rightArr.length === 0) {
        if (parentListArr.length <= 1) {
            finishSorting(parentListArr.length > 0 ? parentListArr[0] : []);
            return;
        } else {
            listArr = parentListArr;
            parentListArr = [];
            setupNextMatch();
            return;
        }
    }
    currentLeft = leftArr[leftIndex];
    currentRight = rightArr[rightIndex];
    renderMatch();
    updateProgress();
}
function renderMatch() {
    imgLeft.src = currentLeft.image;
    imgLeft.onerror = () => { imgLeft.src = 'assets/img/defaultL.webp'; };
    imgRight.src = currentRight.image;
    imgRight.onerror = () => { imgRight.src = 'assets/img/defaultR.webp'; };
    btnIgnoreLeft.classList.remove('hidden');
    btnIgnoreRight.classList.remove('hidden');
    saveGameState();
}
function processWinnerLoss(winner, loser) {
    saveHistory();
    currentMatchCount++;
    if (winner === currentLeft) {
        mergedArr.push(currentLeft);
        leftIndex++;
    } else {
        mergedArr.push(currentRight);
        rightIndex++;
    }
    setupNextMatch();
}
function processIgnore(ignoredChar, otherChar, isLeftIgnored) {
    saveHistory();
    currentMatchCount++;
    eliminatedList.push(ignoredChar);
    if (isLeftIgnored) {
        leftIndex++;
    } else {
        rightIndex++;
    }
    setupNextMatch();
}
function processDraw() {
    saveHistory();
    currentMatchCount++;
    mergedArr.push(currentLeft);
    mergedArr.push(currentRight);
    leftIndex++;
    rightIndex++;
    setupNextMatch();
}
btnUndo.addEventListener('click', () => {
    if (historyStack.length === 0) {
        alert(t('alert_no_undo'));
        return;
    }
    const prevState = historyStack.pop();
    listArr = prevState.listArr;
    parentListArr = prevState.parentListArr;
    leftArr = prevState.leftArr;
    rightArr = prevState.rightArr;
    leftIndex = prevState.leftIndex;
    rightIndex = prevState.rightIndex;
    mergedArr = prevState.mergedArr;
    eliminatedList = prevState.eliminatedList;
    currentLeft = prevState.currentLeft;
    currentRight = prevState.currentRight;
    currentMatchCount = prevState.currentMatchCount;
    renderMatch();
    updateProgress();
});
cardLeft.addEventListener('click', (e) => {
    if (e.target === btnIgnoreLeft) return;
    processWinnerLoss(currentLeft, currentRight);
});
cardRight.addEventListener('click', (e) => {
    if (e.target === btnIgnoreRight) return;
    processWinnerLoss(currentRight, currentLeft);
});
btnIgnoreLeft.addEventListener('click', (e) => {
    e.stopPropagation();
    processIgnore(currentLeft, currentRight, true);
});
btnIgnoreRight.addEventListener('click', (e) => {
    e.stopPropagation();
    processIgnore(currentRight, currentLeft, false);
});
btnDraw.addEventListener('click', processDraw);
document.addEventListener('keydown', (e) => {
    if (!screenMain.classList.contains('active')) return;
    const key = e.key.toLowerCase();
    switch (key) {
        case 'a':
            if (currentLeft && currentRight) processWinnerLoss(currentLeft, currentRight);
            break;
        case "'":
            if (currentLeft && currentRight) processWinnerLoss(currentRight, currentLeft);
            break;
        case 'z':
            if (currentLeft && currentRight) processIgnore(currentLeft, currentRight, true);
            break;
        case '/':
            if (currentLeft && currentRight) processIgnore(currentRight, currentLeft, false);
            break;
        case ' ':
            e.preventDefault();
            if (currentLeft && currentRight) processDraw();
            break;
        case 'backspace':
            btnUndo.click();
            break;
    }
});
function finishSorting(sortedArray) {
    progressBarFill.style.width = '100%';
    progressPercentage.textContent = '100%';
    let finalRankings = [];
    let currentRank = 1;
    sortedArray.forEach(char => {
        if (finalRankings.length < MAX_RANK_DISPLAY) {
            finalRankings.push({ rank: currentRank++, char });
        }
    });
    eliminatedList.reverse().forEach(char => {
        if (finalRankings.length < MAX_RANK_DISPLAY) {
            finalRankings.push({ rank: currentRank++, char });
        }
    });
    renderResults(finalRankings);
    switchScreen(screenResult);
}
function renderResults(rankings) {
    rankingList.innerHTML = '';
    const podium = document.createElement('div');
    podium.className = 'result-podium';
    const top10Container = document.createElement('div');
    top10Container.className = 'result-group top10-group';
    const top10Row1 = document.createElement('div');
    top10Row1.className = 'result-row';
    const top10Row2 = document.createElement('div');
    top10Row2.className = 'result-row';
    top10Container.appendChild(top10Row1);
    top10Container.appendChild(top10Row2);
    const top30Container = document.createElement('div');
    top30Container.className = 'result-group top30-group';
    const createThumb = (item, extraClass) => {
        const div = document.createElement('div');
        div.className = `result-thumb ${extraClass}`;
        div.title = `${item.rank}위: ${item.char.name}`;
        div.innerHTML = `
            <img src="${item.char.image}" alt="">
            <div class="rank-badge">${item.rank}</div>
        `;
        return div;
    };
    const top3Items = [null, null, null];
    rankings.forEach((item, index) => {
        if (index === 0) top3Items[1] = createThumb(item, 'podium-1');
        else if (index === 1) top3Items[0] = createThumb(item, 'podium-2');
        else if (index === 2) top3Items[2] = createThumb(item, 'podium-3');
        else if (index >= 3 && index < 10) {
            const thumb = createThumb(item, 'grid-item-top10');
            if (index < 6) top10Row1.appendChild(thumb);
            else top10Row2.appendChild(thumb);
        } else if (index >= 10 && index < 30) {
            const thumb = createThumb(item, 'grid-item-top30');
            top30Container.appendChild(thumb);
        }
    });
    top3Items.forEach(item => {
        if (item) podium.appendChild(item);
    });
    rankingList.appendChild(podium);
    if (rankings.length > 3) rankingList.appendChild(top10Container);
    if (rankings.length > 10) rankingList.appendChild(top30Container);
}
applyTranslations();
