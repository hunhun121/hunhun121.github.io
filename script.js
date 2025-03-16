// 書籍データの仮の構造
let bookData = JSON.parse(localStorage.getItem('bookData')) || {
    isbn: "9784123456789",
    title: "サンプル書籍",
    reviews: []
};

// グローバル変数として Chart インスタンスを保持
let emotionChart = null;

// レビューの追加

document.getElementById('reviewForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const review = {
        id: Date.now(),
        title: document.getElementById('reviewTitle').value,
        emotion: document.getElementById('emotion').value,
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
                <h3 class="font-bold">${review.title}</h3>
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

// 感情の集計とグラフの更新
function updateEmotionChart() {
    const emotions = bookData.reviews.map(review => review.emotion);
    const emotionCounts = {};

    emotions.forEach(emotion => {
        if (emotionCounts[emotion]) {
            emotionCounts[emotion]++;
        } else {
            emotionCounts[emotion] = 1;
        }
    });

    const labels = Object.keys(emotionCounts);
    const data = Object.values(emotionCounts);

    if (emotionChart) {
        emotionChart.destroy();
    }

    const ctx = document.getElementById('emotionChart').getContext('2d');
    
    emotionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,  // これを false にすることでサイズを自由に調整可能
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,  // 凡例のサイズを小さくする
                        font: {
                            size: 12    // フォントサイズを小さくする
                        }
                    }
                }
            }
        }
    });
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
