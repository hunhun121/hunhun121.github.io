let bookData = {
    isbn: "",
    title: "",
    coverImage: "",
    reviews: []  // 初期化する
};


// ローカルストレージからデータを取得
function loadBookData() {
    const savedData = localStorage.getItem('bookData');
    if (savedData) {
        bookData = JSON.parse(savedData);
        displayBookInfo();
        updateReviewsList();
        updateEmotionChart();
    }
}

function saveBookData() {
    localStorage.setItem('bookData', JSON.stringify(bookData));
}


// データをローカルストレージに保存
function saveBookData() {
    localStorage.setItem(bookData.isbn, JSON.stringify(bookData));
}

// 楽天ブックスAPIを利用して本のタイトルと表紙画像を取得する関数
async function fetchBookInfoByISBN(isbn) {
    const applicationId = '1018000679257868289';  // あなたのアプリIDを指定
    const url = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?format=json&applicationId=${applicationId}&isbn=${isbn}`;

    
        
try{
    const response = await fetch(url);
        if (!response.ok) {  // レスポンスがエラーの場合
            throw new Error(`HTTPエラー: ${response.status}`);
        }

        const data = await response.json();

        if (data.Items && data.Items.length > 0) {
            const bookInfo = data.Items[0].Item;

            // bookDataに保存
            bookData.title = bookInfo.title;
            bookData.coverImage = bookInfo.largeImageUrl;
            bookData.isbn = isbn;
            saveBookData();  // ローカルストレージに保存

            displayBookInfo();
        } else {
            alert("本が見つかりませんでした。ISBNを確認してください。");
        }
    } catch (error) {
        console.error("本の情報を取得できませんでした。", error);
        alert("本の情報を取得できませんでした。エラー: " + error.message);
    }
}

// 本の情報を画面に表示する関数
function displayBookInfo() {
    document.getElementById('bookTitle').innerText = bookData.title;
    document.getElementById('bookCover').innerHTML = bookData.coverImage ? 
        `<img src="${bookData.coverImage}" alt="${bookData.title}" class="w-full h-full object-cover rounded-md">` : 
        "表紙画像が見つかりません。";
}

// URLからISBNを取得し、本の情報を取得する
function getISBNFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const isbn = urlParams.get("isbn");

    if (isbn) {
        bookData.isbn = isbn;
        loadBookData();  // ローカルストレージから読み込み
        fetchBookInfoByISBN(isbn);
    } else {
        alert("ISBN が URL パラメーターに含まれていません。例: ?isbn=9784040693163");
    }
}

// ページが読み込まれた時にISBNを取得して処理を開始
window.addEventListener('load', getISBNFromURL);


// グローバル変数として Chart インスタンスを保持
let emotionChart = null;

// レビューの追加

document.getElementById('reviewForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const review = {
        id: Date.now(),
        title: document.getElementById('reviewTitle').value,
        pageNumber: parseInt(document.getElementById('pageNumber').value),
        emotion: document.getElementById('emotion').value,
        emotionStrength: parseInt(document.getElementById('emotionStrength').value),
        content: document.getElementById('reviewContent').value,
        timestamp: new Date().toLocaleString(),
        isbn: bookData.isbn
    };
    
    bookData.reviews.push(review);
    saveData();
    updateReviewsList();
    updateEmotionChart();
    this.reset();
    });


// データを保存
function saveData() {
    localStorage.setItem('bookData', JSON.stringify(bookData));
}

// レビュー一覧の更新
function updateReviewsList() {
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = bookData.reviews.map(review => `
        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold">${review.title}<span class="text-gray-500">(p.${review.pageNumber})</span></h3>
                <div class="space-x-2">
                    <button onclick="editReview(${review.id})" class="text-blue-600">編集</button>
                    <button onclick="deleteReview(${review.id})" class="text-red-600">削除</button>
                </div>
            </div>
            <div class="text-sm text-gray-600 mb-2">
                <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    ${review.emotion}
                </span>
            </div>
            <p class="mb-2">${review.content}</p>
            <div class="text-xs text-gray-500">${review.timestamp}</div>
        </div>
    `).join('');
}
// 感情推移グラフの更新
function updateEmotionChart() {
    const emotionGroups = {};
    bookData.reviews.forEach(review => {
        if (!emotionGroups[review.emotion]) {
            emotionGroups[review.emotion] = {};
        }
        emotionGroups[review.emotion][review.pageNumber] = review.emotionStrength;
    });

    const labels = Array.from(new Set(bookData.reviews.map(review => review.pageNumber))).sort((a, b) => a - b);

    const datasets = Object.keys(emotionGroups).map(emotion => {
        const data = labels.map(pageNumber => emotionGroups[emotion][pageNumber] || 0);
        return {
            label: emotion,
            data: data,
            fill: false,
            borderColor: getRandomColor(),
            tension: 0.1
        };
    });

    if (emotionChart) {
        emotionChart.destroy();
    }

    const ctx = document.getElementById('emotionChart').getContext('2d');
    emotionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    title: {
                        display: true,
                        text: '感情の強さ'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'ページ数'
                    }
                }
            }
        }
    });
}

// 色をランダムに生成する関数
function getRandomColor() {
    return `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
}
        



// レビューの編集
function editReview(id) {
    const review = bookData.reviews.find(r => r.id === id);
    if (review) {
        document.getElementById('reviewTitle').value = review.title;
        document.getElementById('emotion').value = review.emotion;
        document.getElementById('reviewContent').value = review.content;
        
        // 既存のレビューを削除
        deleteReview(id);

        // フォームまでスクロール
        document.getElementById('reviewForm').scrollIntoView({ behavior: 'smooth' });
    }
}

// レビューの削除
function deleteReview(id) {
    bookData.reviews = bookData.reviews.filter(r => r.id !== id);
    saveData();
    updateReviewsList();
    updateEmotionChart();
}

// 初期表示
updateReviewsList();
updateEmotionChart();