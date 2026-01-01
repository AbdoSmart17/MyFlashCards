let cards = [];
let index = 0;
let flipped = false;

const card = document.getElementById("flashcard");

// تحميل البطاقات المحفوظة عند بدء التشغيل
window.addEventListener('DOMContentLoaded', () => {
    loadSavedCards();
    updateUI();
    setupEventListeners();
});

// إعداد مستمعات الأحداث
function setupEventListeners() {
    // تحليل ملف CSV
    document.getElementById("csv").addEventListener("change", e => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => parseCSV(reader.result);
        reader.readAsText(file, "UTF-8");
    });
    
    // اختصارات لوحة المفاتيح
    document.addEventListener("keydown", handleKeyboardShortcuts);
}

// معالجة اختصارات لوحة المفاتيح
function handleKeyboardShortcuts(e) {
    if (e.key === "ArrowRight" || e.key === "d") prevCard();
    if (e.key === "ArrowLeft" || e.key === "a") nextCard();
    if (e.key === " " || e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        toggleCard();
    }
    if (e.key === "Escape" && flipped) toggleCard();
}

// تحليل ملف CSV
function parseCSV(text) {
    try {
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 1) return;

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

        let qI = -1, aI = -1, lI = -1, dI = -1;

        headers.forEach((h, i) => {
            if (["سؤال", "question", "q"].includes(h)) qI = i;
            if (["جواب", "answer", "a"].includes(h)) aI = i;
            if (["درس", "lesson", "topic", "subject"].includes(h)) lI = i;
            if (["صعوبة", "difficulty", "level"].includes(h)) dI = i;
        });

        const start = (qI !== -1 && aI !== -1) ? 1 : 0;
        const newCards = [];

        for (let i = start; i < lines.length; i++) {
            // استخدام regex لتحليل CSV بشكل أفضل
            const cols = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
            if (!cols) continue;
            
            const cleanCols = cols.map(col => {
                return col.replace(/^"|"$/g, '').trim().replace(/\s+/g, ' ');
            });
            
            const q = qI !== -1 ? cleanCols[qI] : cleanCols[0];
            const a = aI !== -1 ? cleanCols[aI] : cleanCols[1];
            const l = lI !== -1 ? cleanCols[lI] : "عام";
            const d = dI !== -1 ? cleanCols[dI] : "سهل";

            if (q && a) {
                newCards.push({ q, a, l, d });
            }
        }

        if (newCards.length > 0) {
            cards = [...cards, ...newCards];
            index = cards.length - newCards.length;
            saveCardsToStorage();
            showCard();
            updateUI();
            
            showNotification(`تم استيراد ${newCards.length} بطاقة جديدة`, "success");
        } else {
            showNotification("لم يتم العثور على بطاقات في الملف", "warning");
        }
    } catch (error) {
        console.error("خطأ في تحليل ملف CSV:", error);
        showNotification("حدث خطأ في تحليل ملف CSV", "warning");
    }
}

// عرض البطاقة الحالية
function showCard() {
    if (!cards.length) {
        resetCardDisplay();
        return;
    }

    flipped = false;
    card.classList.remove("flipped");

    const currentCard = cards[index];

    // تحديث واجهة البطاقة
    const lessonTag = document.getElementById("lesson-tag");
    const lessonTagBack = document.getElementById("lesson-tag-back");
    const difficultyTag = document.getElementById("difficulty-tag");
    const cardDate = document.getElementById("card-date");
    
    lessonTag.innerText = currentCard.l;
    lessonTag.setAttribute("data-lesson", currentCard.l);
    lessonTagBack.innerText = currentCard.l;
    lessonTagBack.setAttribute("data-lesson", currentCard.l);
    
    // تحديث علامة الصعوبة
    if (difficultyTag && currentCard.d) {
        difficultyTag.innerText = currentCard.d;
        difficultyTag.style.background = getDifficultyColor(currentCard.d);
    }
    
    // تحديث تاريخ البطاقة
    if (cardDate) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        cardDate.innerText = `آخر تحديث: ${timeString}`;
    }
    
    // تنظيف النصوص من المسافات الزائدة
    const cleanQuestion = currentCard.q.replace(/\s+/g, ' ').trim();
    const cleanAnswer = currentCard.a.replace(/\s+/g, ' ').trim();
    
    document.getElementById("question").innerText = cleanQuestion;
    document.getElementById("answer").innerText = cleanAnswer;
    document.getElementById("q-number").innerText = `سؤال ${index + 1}`;
    document.getElementById("counter").innerText = `${index + 1} / ${cards.length}`;

    // تحديث شريط التقدم
    const progress = ((index + 1) / cards.length * 100);
    document.getElementById("progress").style.width = `${progress}%`;
    document.getElementById("progress-text").innerText = `${Math.round(progress)}%`;
}

// الحصول على لون الصعوبة
function getDifficultyColor(difficulty) {
    switch(difficulty.toLowerCase()) {
        case "سهل": return "linear-gradient(135deg, #10B981, #34D399)";
        case "متوسط": return "linear-gradient(135deg, #F59E0B, #FBBF24)";
        case "صعب": return "linear-gradient(135deg, #EF4444, #F87171)";
        default: return "linear-gradient(135deg, #6B7280, #9CA3AF)";
    }
}

function resetCardDisplay() {
    document.getElementById("lesson-tag").innerText = "عام";
    document.getElementById("lesson-tag-back").innerText = "عام";
    document.getElementById("question").innerText = "استورد ملف CSV للبدء باستخدام الزر أدناه";
    document.getElementById("answer").innerText = "الجواب";
    document.getElementById("q-number").innerText = "سؤال 0";
    document.getElementById("counter").innerText = "0 / 0";
    document.getElementById("progress").style.width = "0%";
    document.getElementById("progress-text").innerText = "0%";
    
    const difficultyTag = document.getElementById("difficulty-tag");
    if (difficultyTag) {
        difficultyTag.innerText = "سهل";
        difficultyTag.style.background = "linear-gradient(135deg, #10B981, #34D399)";
    }
    
    const cardDate = document.getElementById("card-date");
    if (cardDate) {
        cardDate.innerText = "تم التحميل: الآن";
    }
}

function toggleCard() {
    if (!cards.length) return;
    flipped = !flipped;
    card.classList.toggle("flipped", flipped);
}

function nextCard() {
    if (!cards.length) return;
    index = (index + 1) % cards.length;
    showCard();
}

function prevCard() {
    if (!cards.length) return;
    index = (index - 1 + cards.length) % cards.length;
    showCard();
}

// حفظ البطاقات في التخزين المحلي
function saveCardsToStorage() {
    try {
        localStorage.setItem('flashcards_data', JSON.stringify(cards));
    } catch (e) {
        console.error("خطأ في حفظ البيانات:", e);
        showNotification("حدث خطأ في حفظ البيانات", "warning");
    }
}

// تحميل البطاقات المحفوظة
function loadSavedCards() {
    try {
        const saved = localStorage.getItem('flashcards_data');
        if (saved) {
            cards = JSON.parse(saved);
            if (cards.length > 0) {
                index = 0;
                showCard();
            }
        }
    } catch (e) {
        console.error("خطأ في تحميل البيانات:", e);
        cards = [];
        saveCardsToStorage();
    }
}

// تصدير البطاقات كملف CSV
function exportCSV() {
    if (!cards.length) {
        showNotification("لا توجد بطاقات للتصدير", "warning");
        return;
    }
    
    const headers = ["سؤال", "جواب", "درس", "صعوبة"];
    const cleanCards = cards.map(card => ({
        q: card.q.replace(/"/g, '""').replace(/\s+/g, ' ').trim(),
        a: card.a.replace(/"/g, '""').replace(/\s+/g, ' ').trim(),
        l: card.l.replace(/"/g, '""').replace(/\s+/g, ' ').trim(),
        d: card.d || "سهل"
    }));
    
    const csvContent = [
        headers.join(","),
        ...cleanCards.map(card => `"${card.q}","${card.a}","${card.l}","${card.d}"`)
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `بطاقات_تعليمية_${timestamp}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`تم تصدير ${cards.length} بطاقة`, "success");
}

// مسح جميع البطاقات
function clearAllCards() {
    if (cards.length === 0) {
        showNotification("لا توجد بطاقات للمسح", "info");
        return;
    }
    
    // تأثير اهتزاز للزر كنوع من التأكيد البصري
    const clearBtn = document.getElementById("clear-btn");
    clearBtn.classList.add("shake");
    setTimeout(() => clearBtn.classList.remove("shake"), 500);
    
    // طلب تأكيد من المستخدم
    if (confirm(`هل أنت متأكد من مسح جميع البطاقات (${cards.length} بطاقة)؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
        cards = [];
        index = 0;
        saveCardsToStorage();
        showCard();
        updateUI();
        
        showNotification("تم مسح جميع البطاقات بنجاح", "success");
        
        // إضافة تأثير اهتزاز للبطاقة
        card.classList.add("shake");
        setTimeout(() => card.classList.remove("shake"), 500);
    }
}

// تحديث واجهة المستخدم
function updateUI() {
    const exportBtn = document.getElementById("export-btn");
    const clearBtn = document.getElementById("clear-btn");
    const totalCardsEl = document.getElementById("total-cards");
    const totalLessonsEl = document.getElementById("total-lessons");
    
    // تحديث حالة الأزرار
    if (exportBtn) exportBtn.disabled = cards.length === 0;
    if (clearBtn) clearBtn.disabled = cards.length === 0;
    
    // تحديث الإحصائيات
    if (totalCardsEl) totalCardsEl.textContent = cards.length;
    
    // حساب عدد الدروس المختلفة
    const uniqueLessons = [...new Set(cards.map(card => card.l))];
    if (totalLessonsEl) totalLessonsEl.textContent = uniqueLessons.length;
}

// إظهار إشعار
function showNotification(message, type = "success") {
    // إنشاء عنصر الإشعار
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 
                 type === 'info' ? 'info-circle' : 'bell';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // إضافة أنماط الإشعارات إذا لم تكن موجودة
    if (!document.querySelector('#notification-styles')) {
        addNotificationStyles();
    }
    
    // إضافة إلى الجسم
    document.body.appendChild(notification);
    
    // إظهار مع تأثير
    setTimeout(() => notification.classList.add('show'), 10);
    
    // إخفاء بعد 3 ثواني
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// إضافة أنماط الإشعارات
function addNotificationStyles() {
    const notificationStyles = document.createElement('style');
    notificationStyles.id = 'notification-styles';
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            bottom: 25px;
            left: 25px;
            background: white;
            color: #1F2937;
            padding: 1.1rem 1.75rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 0.85rem;
            z-index: 10000;
            transform: translateX(-100%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 400px;
            border-right: 5px solid;
            border-top: 1px solid #F3F4F6;
            border-bottom: 1px solid #F3F4F6;
            border-left: 1px solid #F3F4F6;
        }
        
        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification.success {
            border-right-color: #10B981;
        }
        
        .notification.warning {
            border-right-color: #F59E0B;
        }
        
        .notification.info {
            border-right-color: #3B82F6;
        }
        
        .notification i {
            font-size: 1.3rem;
        }
        
        .notification.success i {
            color: #10B981;
        }
        
        .notification.warning i {
            color: #F59E0B;
        }
        
        .notification.info i {
            color: #3B82F6;
        }
        
        @media (max-width: 768px) {
            .notification {
                max-width: 300px;
                padding: 0.9rem 1.25rem;
                bottom: 15px;
                left: 15px;
            }
        }
    `;
    document.head.appendChild(notificationStyles);
}

// التحقق مما إذا كانت هناك بطاقات مخزنة عند التحميل الأول
window.addEventListener('load', () => {
    setTimeout(() => {
        if (cards.length === 0) {
            showNotification("قم باستيراد ملف CSV للبدء، أو استخدم البطاقات الموجودة لديك", "info");
        }
    }, 1500);
});