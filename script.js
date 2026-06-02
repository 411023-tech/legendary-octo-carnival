// 應用狀態
const app = {
    words: [],
    currentIndex: 0,
    isFlipped: false,
    storageKey: 'wordCardData'
};

// DOM 元素
const learnTab = document.getElementById('learn-tab');
const manageTab = document.getElementById('manage-tab');
const learnPage = document.getElementById('learn-page');
const managePage = document.getElementById('manage-page');
const flipCard = document.getElementById('flip-card');
const cardWord = document.getElementById('card-word');
const cardTranslation = document.getElementById('card-translation');
const cardPos = document.getElementById('card-pos');
const cardExample = document.getElementById('card-example');
const cardEtymology = document.getElementById('card-etymology');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const currentIndex = document.getElementById('current-index');
const totalCount = document.getElementById('total-count');
const statsText = document.getElementById('stats-text');
const wordForm = document.getElementById('word-form');
const inputWord = document.getElementById('input-word');
const inputTranslation = document.getElementById('input-translation');
const inputPos = document.getElementById('input-pos');
const inputExample = document.getElementById('input-example');
const inputEtymology = document.getElementById('input-etymology');
const autoFillBtn = document.getElementById('auto-fill-btn');
const wordsList = document.getElementById('words-list');
const wordListCount = document.getElementById('word-list-count');
const loadingIndicator = document.getElementById('loading-indicator');
const toast = document.getElementById('toast');

// 初始化應用
function init() {
    loadData();
    setupEventListeners();
    updateUI();
    
    // 如果沒有單字，顯示提示
    if (app.words.length === 0) {
        statsText.textContent = '還沒有單字，請到管理頁面新增';
    }
}

// 設置事件監聽
function setupEventListeners() {
    // 標籤頁切換
    learnTab.addEventListener('click', switchToLearn);
    manageTab.addEventListener('click', switchToManage);
    
    // 卡片翻轉
    flipCard.addEventListener('click', toggleFlip);
    
    // 前後導航
    prevBtn.addEventListener('click', previousWord);
    nextBtn.addEventListener('click', nextWord);
    
    // 表單提交
    wordForm.addEventListener('submit', addWord);
    
    // 自動填入
    autoFillBtn.addEventListener('click', autoFillWord);
}

// 頁面切換
function switchToLearn() {
    learnPage.classList.add('active');
    managePage.classList.remove('active');
    learnTab.classList.add('active');
    manageTab.classList.remove('active');
    app.isFlipped = false;
    flipCard.classList.remove('flipped');
}

function switchToManage() {
    learnPage.classList.remove('active');
    managePage.classList.add('active');
    learnTab.classList.remove('active');
    manageTab.classList.add('active');
}

// 卡片翻轉
function toggleFlip() {
    app.isFlipped = !app.isFlipped;
    flipCard.classList.toggle('flipped');
}

// 單字導航
function previousWord() {
    if (app.words.length === 0) return;
    app.currentIndex = (app.currentIndex - 1 + app.words.length) % app.words.length;
    app.isFlipped = false;
    flipCard.classList.remove('flipped');
    updateDisplay();
}

function nextWord() {
    if (app.words.length === 0) return;
    app.currentIndex = (app.currentIndex + 1) % app.words.length;
    app.isFlipped = false;
    flipCard.classList.remove('flipped');
    updateDisplay();
}

// 更新卡片顯示
function updateDisplay() {
    if (app.words.length === 0) {
        cardWord.textContent = '尚無單字';
        cardTranslation.textContent = '-';
        cardPos.textContent = '-';
        cardExample.textContent = '-';
        cardEtymology.textContent = '-';
        currentIndex.textContent = '0';
        totalCount.textContent = '0';
        return;
    }

    const word = app.words[app.currentIndex];
    cardWord.textContent = word.word;
    cardTranslation.textContent = word.translation || '-';
    cardPos.textContent = word.pos || '-';
    cardExample.textContent = word.example || '-';
    cardEtymology.textContent = word.etymology || '-';
    currentIndex.textContent = app.currentIndex + 1;
    totalCount.textContent = app.words.length;
}

// 添加單字
function addWord(e) {
    e.preventDefault();

    const word = inputWord.value.trim();
    const translation = inputTranslation.value.trim();

    if (!word || !translation) {
        showToast('請填寫英文單字和翻譯', 'error');
        return;
    }

    // 檢查是否重複
    if (app.words.some(w => w.word.toLowerCase() === word.toLowerCase())) {
        showToast('這個單字已存在', 'error');
        return;
    }

    const newWord = {
        id: Date.now(),
        word,
        translation,
        pos: inputPos.value.trim(),
        example: inputExample.value.trim(),
        etymology: inputEtymology.value.trim()
    };

    app.words.push(newWord);
    saveData();
    resetForm();
    updateUI();
    showToast(`已新增單字：${word}`, 'success');
}

// 自動填入單字資訊
async function autoFillWord() {
    const word = inputWord.value.trim();

    if (!word) {
        showToast('請先輸入英文單字', 'error');
        return;
    }

    showLoading(true);
    autoFillBtn.disabled = true;

    try {
        // 調用 Free Dictionary API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (!response.ok) {
            throw new Error('單字未找到');
        }

        const data = await response.json();
        const entry = data[0];

        // 提取翻譯 (第一個意義的簡短定義)
        if (entry.meanings && entry.meanings.length > 0) {
            const firstMeaning = entry.meanings[0];
            
            // 詞性
            inputPos.value = firstMeaning.partOfSpeech || '';

            // 翻譯 (從definitions提取)
            if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
                inputTranslation.value = firstMeaning.definitions[0].definition || '';

                // 例句
                if (firstMeaning.definitions[0].example) {
                    inputExample.value = firstMeaning.definitions[0].example;
                }
            }

            // 同義詞作為補充信息
            if (firstMeaning.synonyms && firstMeaning.synonyms.length > 0) {
                inputEtymology.value = `同義詞：${firstMeaning.synonyms.slice(0, 5).join(', ')}`;
            }

            // 如果有詞源信息，添加
            if (entry.origin) {
                inputEtymology.value += (inputEtymology.value ? '\n\n' : '') + `詞源：${entry.origin}`;
            }

            showToast(`已自動填入 "${word}" 的資訊`, 'success');
        }
    } catch (error) {
        console.error('API 錯誤:', error);
        showToast(`查詢失敗：${error.message}，請手動填入`, 'error');
    } finally {
        showLoading(false);
        autoFillBtn.disabled = false;
    }
}

// 刪除單字
function deleteWord(id) {
    if (confirm('確定要刪除這個單字嗎？')) {
        app.words = app.words.filter(w => w.id !== id);
        saveData();
        updateUI();
        showToast('已刪除單字', 'success');
    }
}

// 編輯單字
function editWord(id) {
    const word = app.words.find(w => w.id === id);
    if (word) {
        inputWord.value = word.word;
        inputTranslation.value = word.translation;
        inputPos.value = word.pos;
        inputExample.value = word.example;
        inputEtymology.value = word.etymology;

        // 刪除舊單字
        deleteWordDirect(id);

        // 滾動到表單
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
        inputWord.focus();
    }
}

// 直接刪除單字（不要求確認）
function deleteWordDirect(id) {
    app.words = app.words.filter(w => w.id !== id);
    saveData();
    updateUI();
}

// 更新UI
function updateUI() {
    updateDisplay();
    updateWordsList();
}

// 更新單字列表顯示
function updateWordsList() {
    wordListCount.textContent = app.words.length;

    if (app.words.length === 0) {
        wordsList.innerHTML = '<p class="empty-message">還沒有新增任何單字</p>';
        return;
    }

    wordsList.innerHTML = app.words.map(word => `
        <div class="word-item">
            <div class="word-item-content">
                <div class="word-item-word">${escapeHtml(word.word)}</div>
                <div class="word-item-details">
                    <div class="word-item-detail-row">
                        <span class="word-item-detail-label">翻譯：</span>
                        <span class="word-item-detail-value">${escapeHtml(word.translation || '-')}</span>
                    </div>
                    ${word.pos ? `<div class="word-item-detail-row">
                        <span class="word-item-detail-label">詞性：</span>
                        <span class="word-item-detail-value">${escapeHtml(word.pos)}</span>
                    </div>` : ''}
                    ${word.example ? `<div class="word-item-detail-row">
                        <span class="word-item-detail-label">例句：</span>
                        <span class="word-item-detail-value">${escapeHtml(word.example)}</span>
                    </div>` : ''}
                    ${word.etymology ? `<div class="word-item-detail-row">
                        <span class="word-item-detail-label">分析：</span>
                        <span class="word-item-detail-value">${escapeHtml(word.etymology)}</span>
                    </div>` : ''}
                </div>
            </div>
            <div class="word-item-actions">
                <button class="btn btn-secondary" onclick="editWord(${word.id})" title="編輯">✏️</button>
                <button class="btn btn-danger" onclick="deleteWord(${word.id})" title="刪除">🗑️</button>
            </div>
        </div>
    `).join('');
}

// 重置表單
function resetForm() {
    wordForm.reset();
    inputWord.focus();
}

// 加載數據
function loadData() {
    try {
        const data = localStorage.getItem(app.storageKey);
        if (data) {
            app.words = JSON.parse(data);
        }
    } catch (error) {
        console.error('加載數據失敗:', error);
    }
}

// 保存數據
function saveData() {
    try {
        localStorage.setItem(app.storageKey, JSON.stringify(app.words));
    } catch (error) {
        console.error('保存數據失敗:', error);
        showToast('保存失敗', 'error');
    }
}

// 顯示加載指示器
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

// 顯示通知提示
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// HTML 轉義
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 頁面加載完成時初始化
document.addEventListener('DOMContentLoaded', init);
