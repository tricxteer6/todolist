# PRD — Web App To-Do List

**Nama Project:** TaskFlow
**Jenis:** Full-Stack To-Do List Web Application
**Frontend:** HTML, CSS, JavaScript Vanilla
**Backend:** Node.js + Express.js
**Database:** MySQL
**Design:** Modern, dynamic, interactive, responsive
**Color Theme:** Navy Blue, Lemon Yellow, White

---

## 1. Tujuan Project

Membuat aplikasi To-Do List sederhana untuk membantu pengguna mencatat, mengatur, dan memantau pekerjaan berdasarkan:

* Tanggal dibuat
* Task
* Priority
* Deadline
* Status

Aplikasi harus memiliki fitur CRUD lengkap dan interface yang mudah digunakan baik melalui desktop maupun mobile.

---

# 2. Target Pengguna

Aplikasi ditujukan untuk pengguna yang membutuhkan task management sederhana, seperti:

* Mahasiswa
* Karyawan
* Freelancer
* Developer
* Tim kecil
* Personal productivity

Tidak diperlukan sistem login untuk versi MVP.

---

# 3. Tech Stack

## Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Fetch API
* CSS Flexbox
* CSS Grid

Tidak menggunakan framework frontend.

## Backend

* Node.js
* Express.js
* REST API

## Database

* MySQL

## Development

Recommended:

```text
Node.js
npm
nodemon
dotenv
mysql2
cors
```

---

# 4. Konsep Visual

Tema utama menggunakan kombinasi:

### Navy Blue

```text
#0F172A
```

Untuk:

* Navbar
* Heading
* Button utama
* Sidebar jika digunakan
* Footer

### Lemon Yellow

```text
#FDE047
```

Untuk:

* CTA
* Highlight
* Priority indicator
* Active state
* Badge tertentu

### White

```text
#FFFFFF
```

Untuk:

* Background card
* Form
* Modal
* Content

### Secondary Colors

```text
Background: #F8FAFC
Text:       #1E293B
Muted:      #64748B
Border:     #E2E8F0
Success:    #22C55E
Danger:     #EF4444
Warning:    #F59E0B
```

---

# 5. Design Direction

UI harus memiliki karakter:

* Modern
* Clean
* Minimal
* Profesional
* Banyak whitespace
* Rounded corners
* Soft shadow
* Smooth transition
* Interactive
* Responsive

Hindari desain yang terlalu ramai.

Gunakan:

```text
border-radius: 12px - 16px
```

dan transition sekitar:

```text
200ms - 300ms
```

---

# 6. Struktur Halaman

Karena aplikasi sederhana, MVP cukup menggunakan **single-page application menggunakan Vanilla JavaScript**.

Struktur:

```text
Navbar
│
├── Dashboard
│
├── Task Summary
│
├── Add Task
│
├── Task List
│
└── Footer
```

---

# 7. Navbar

Navbar berada di bagian atas.

### Isi

Logo:

> TaskFlow

Navigation:

* Dashboard
* Tasks

Button:

> * Add Task

### Behavior

Navbar:

* Sticky.
* Responsive.
* Background navy.
* Logo menggunakan warna putih.
* Highlight menggunakan lemon yellow.

Pada mobile:

```text
TaskFlow                    ☰
```

Menu berubah menjadi mobile navigation.

---

# 8. Dashboard / Hero

Bagian atas dashboard memberikan gambaran singkat kondisi task.

### Heading

> Manage Your Tasks

### Subtitle

> Organize your work, stay focused, and get things done.

Tambahkan tombol:

> * Add New Task

---

# 9. Task Summary

Tampilkan statistik task dalam bentuk cards.

Minimal:

### Total Tasks

```text
24
Total Tasks
```

### Pending

```text
12
Pending
```

### In Progress

```text
7
In Progress
```

### Completed

```text
5
Completed
```

Card harus memiliki:

* Icon
* Number
* Label
* Hover animation

Contoh:

```text
┌──────────────────────┐
│  ✓                   │
│                      │
│  24                  │
│  Total Tasks         │
└──────────────────────┘
```

---

# 10. Task Management

Section utama aplikasi.

### Header

```text
My Tasks

[ Search Tasks... ] [ Filter ▼ ] [ + Add Task ]
```

---

# 11. Task Attributes

Setiap task memiliki atribut:

| Field      | Type      | Required |
| ---------- | --------- | -------- |
| ID         | Integer   | Auto     |
| Date       | Date      | Yes      |
| Task       | String    | Yes      |
| Priority   | Enum      | Yes      |
| Deadline   | Date      | Yes      |
| Status     | Enum      | Yes      |
| Created At | Timestamp | Auto     |
| Updated At | Timestamp | Auto     |

---

# 12. Priority

Priority memiliki tiga level:

### Low

Badge:

> Low

### Medium

Badge:

> Medium

### High

Badge:

> High

Secara visual:

```text
Low       → Soft/neutral
Medium    → Yellow
High      → Red
```

Namun warna utama aplikasi tetap menggunakan navy + lemon.

---

# 13. Status

Status task:

```text
Pending
In Progress
Completed
```

### Pending

Task belum dimulai.

### In Progress

Task sedang dikerjakan.

### Completed

Task sudah selesai.

Status dapat diubah langsung dari task card/table.

---

# 14. Task Display

Desktop menggunakan table/list modern.

Contoh:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Date       Task                 Priority   Deadline   Status    │
├─────────────────────────────────────────────────────────────────┤
│ Aug 20     Build Landing Page   High       Aug 22     Progress  │
│ Aug 20     Fix Database         Medium     Aug 21     Pending   │
│ Aug 19     Update Documentation Low        Aug 20     Done      │
└─────────────────────────────────────────────────────────────────┘
```

Setiap task memiliki action:

```text
[Edit] [Delete]
```

---

# 15. Mobile Task Display

Pada mobile, jangan memaksakan table horizontal.

Gunakan card:

```text
┌──────────────────────────────┐
│ Build Landing Page           │
│                              │
│ 📅 Aug 20, 2026              │
│ ⏰ Deadline: Aug 22, 2026    │
│                              │
│ 🔥 HIGH      IN PROGRESS     │
│                              │
│             Edit   Delete    │
└──────────────────────────────┘
```

---

# 16. Add Task

Ketika user klik:

> * Add Task

muncul modal.

Form:

```text
Task
[________________________]

Date
[________________________]

Priority
[ Low ▼ ]

Deadline
[________________________]

Status
[ Pending ▼ ]

[ Cancel ] [ Add Task ]
```

### Validation

Task:

* Required.
* Minimal 3 karakter.

Date:

* Required.

Priority:

* Required.

Deadline:

* Required.
* Tidak boleh lebih awal dari date.

Status:

* Required.

---

# 17. Edit Task

User dapat mengubah task melalui button:

> Edit

Modal yang sama digunakan untuk edit.

Data lama otomatis dimasukkan ke form.

Button:

> Save Changes

Setelah berhasil:

> Task updated successfully.

---

# 18. Delete Task

Ketika user menekan Delete, tampil confirmation dialog:

> Delete this task?

Buttons:

```text
Cancel
Delete
```

Jika dikonfirmasi:

```text
Task deleted successfully.
```

Task langsung menghilang dari UI tanpa perlu refresh.

---

# 19. Search

Search bar digunakan untuk mencari berdasarkan nama task.

Contoh:

```text
Search Tasks...
```

User mengetik:

```text
database
```

Maka hanya task yang mengandung kata:

```text
database
```

yang ditampilkan.

Search dilakukan secara realtime di frontend.

---

# 20. Filter

Filter berdasarkan:

### Status

```text
All
Pending
In Progress
Completed
```

### Priority

```text
All
Low
Medium
High
```

Bisa menggunakan dropdown.

---

# 21. Sorting

Tambahkan sorting sederhana:

```text
Sort By

Newest
Oldest
Deadline
Priority
```

Default:

> Newest

---

# 22. Deadline Indicator

Aplikasi harus membantu user melihat deadline.

### Normal

```text
Due: Aug 25
```

### Deadline Soon

Jika deadline ≤ 2 hari:

```text
Due Soon
```

### Overdue

Jika deadline sudah lewat dan status belum Completed:

```text
Overdue
```

Overdue harus terlihat jelas menggunakan warna merah.

---

# 23. Interactive Behavior

Aplikasi harus terasa dinamis.

### Hover

Task card:

```text
translateY(-2px)
shadow meningkat
```

### Button

Button memiliki:

* Hover
* Active
* Focus

### Modal

Modal:

```text
fade in
scale 0.95 → 1
```

### Task Completion

Ketika status berubah menjadi Completed:

* Status badge berubah.
* Task dapat diberi efek `text-decoration: line-through`.
* Statistik Completed bertambah.
* Pending/In Progress berkurang.

---

# 24. Toast Notification

Setelah action berhasil, tampilkan toast.

Contoh:

```text
✓ Task added successfully
```

```text
✓ Task updated successfully
```

```text
✓ Task deleted successfully
```

Toast muncul di:

**top-right desktop**

atau:

**bottom-center mobile**

Toast otomatis hilang setelah ±3 detik.

---

# 25. Empty State

Jika belum ada task:

```text
        ✓

No tasks yet

Start organizing your work
by creating your first task.

[ + Create Task ]
```

Jika hasil pencarian kosong:

```text
No tasks found.

Try another keyword.
```

---

# 26. REST API

Backend Express menyediakan REST API.

## Get Tasks

```http
GET /api/tasks
```

Mengambil semua task.

---

## Get Single Task

```http
GET /api/tasks/:id
```

---

## Create Task

```http
POST /api/tasks
```

Request:

```json
{
  "date": "2026-08-20",
  "task": "Build landing page",
  "priority": "high",
  "deadline": "2026-08-22",
  "status": "pending"
}
```

---

## Update Task

```http
PUT /api/tasks/:id
```

---

## Delete Task

```http
DELETE /api/tasks/:id
```

---

# 27. API Response

Success:

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Failed to create task"
}
```

Gunakan HTTP status code yang sesuai:

```text
200 → Success
201 → Created
400 → Bad Request
404 → Not Found
500 → Server Error
```

---

# 28. Database Design

Database:

```text
taskflow
```

Table:

```text
tasks
```

Schema:

```sql
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    task VARCHAR(255) NOT NULL,
    priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    deadline DATE NOT NULL,
    status ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

# 29. Backend Structure

Gunakan struktur modular:

```text
backend/
├── config/
│   └── database.js
│
├── controllers/
│   └── taskController.js
│
├── routes/
│   └── taskRoutes.js
│
├── middleware/
│   └── errorHandler.js
│
├── .env
├── server.js
└── package.json
```

---

# 30. Frontend Structure

```text
frontend/
├── index.html
│
├── css/
│   ├── style.css
│   ├── responsive.css
│   └── components.css
│
├── js/
│   ├── app.js
│   ├── api.js
│   ├── tasks.js
│   ├── ui.js
│   └── utils.js
│
└── assets/
    └── icons/
```

Jika ingin lebih sederhana, CSS dan JS boleh digabung menjadi:

```text
frontend/
├── index.html
├── style.css
└── app.js
```

Untuk MVP saya justru menyarankan versi sederhana terlebih dahulu.

---

# 31. Environment Variables

Backend menggunakan `.env`.

```env
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=taskflow
DB_PORT=3306
```

**`.env` tidak boleh di-commit ke Git.**

Tambahkan:

```text
.env
node_modules/
```

ke `.gitignore`.

---

# 32. Error Handling

Backend harus memiliki centralized error handling.

Frontend harus menangani:

* API gagal.
* Database error.
* Network error.
* Invalid form.
* Task tidak ditemukan.

Contoh:

```text
Unable to connect to server.
Please try again.
```

Jangan menampilkan error database mentah kepada user.

---

# 33. Responsive Requirements

### Desktop

Layout menggunakan:

```text
max-width: 1200px
margin: auto
```

### Tablet

Card summary dapat berubah dari:

```text
4 columns
```

menjadi:

```text
2 columns
```

### Mobile

Summary:

```text
1 column / 2 columns
```

Task:

```text
Table → Card
```

Navbar:

```text
Desktop menu → Hamburger
```

Modal:

```text
Centered modal → Full-width-ish mobile modal
```

---

# 34. Performance

Website harus:

* Menggunakan Vanilla JS.
* Tidak menggunakan library frontend besar.
* Meminimalkan DOM manipulation yang tidak diperlukan.
* Menghindari request API berulang.
* Menggunakan async/await.
* Memisahkan API logic dari UI logic.
* Menangani loading state.

---

# 35. Loading State

Ketika mengambil data:

```text
Loading tasks...
```

atau gunakan skeleton loader.

Contoh:

```text
┌─────────────────────────────┐
│ █████████████               │
│ ████████                    │
│ ███████████████             │
└─────────────────────────────┘
```

---

# 36. Security Basic

Backend harus:

* Menggunakan parameterized query.
* Tidak melakukan SQL string concatenation.
* Menyimpan credentials di `.env`.
* Melakukan validasi input.
* Menggunakan CORS dengan konfigurasi yang sesuai.
* Tidak mengekspos password database.

---

# 37. Development Flow

Urutan pengerjaan:

```text
1. Setup Node.js project
        ↓
2. Setup Express
        ↓
3. Setup MySQL
        ↓
4. Create database
        ↓
5. Create tasks table
        ↓
6. Build REST API
        ↓
7. Test API
        ↓
8. Build HTML structure
        ↓
9. Build CSS
        ↓
10. Build JavaScript
        ↓
11. Connect frontend → API
        ↓
12. Implement CRUD
        ↓
13. Implement search/filter
        ↓
14. Implement dashboard statistics
        ↓
15. Responsive design
        ↓
16. Error handling
        ↓
17. Testing
```

---

# 38. Acceptance Criteria

Project dianggap selesai apabila:

* [ ] User dapat melihat seluruh task.
* [ ] User dapat menambahkan task.
* [ ] User dapat mengedit task.
* [ ] User dapat menghapus task.
* [ ] User dapat mengubah status.
* [ ] User dapat memilih priority.
* [ ] User dapat menentukan deadline.
* [ ] Task tersimpan ke MySQL.
* [ ] Task dapat diambil melalui REST API.
* [ ] Search berfungsi.
* [ ] Filter status berfungsi.
* [ ] Filter priority berfungsi.
* [ ] Sorting berfungsi.
* [ ] Dashboard menampilkan jumlah task secara realtime.
* [ ] Deadline indicator berfungsi.
* [ ] Overdue task terdeteksi.
* [ ] Toast notification tersedia.
* [ ] Loading state tersedia.
* [ ] Empty state tersedia.
* [ ] Delete memiliki confirmation.
* [ ] UI responsive.
* [ ] Mobile menggunakan task card.
* [ ] Tidak terdapat horizontal overflow.
* [ ] API error ditangani dengan baik.
* [ ] Database credentials menggunakan `.env`.
* [ ] Tidak ada SQL injection melalui input user.
* [ ] Backend dapat dijalankan.
* [ ] Frontend dapat terhubung dengan backend.

---

# 39. MVP Scope

Untuk versi pertama, **jangan tambahkan login/user authentication, drag-and-drop, calendar, reminder, atau notification system**.

Fokus MVP:

```text
┌─────────────────────────────────────────┐
│              TASKFLOW                   │
├─────────────────────────────────────────┤
│                                         │
│        Manage Your Tasks                │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ Total│ │Pending│ │Doing │ │ Done │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│  My Tasks                [+ Add Task]   │
│                                         │
│  Search...    Filter...   Sort...       │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Task       Priority Deadline      │  │
│  │───────────────────────────────────│  │
│  │ Build UI   HIGH     Aug 22        │  │
│  │ Fix API    MEDIUM   Aug 24        │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

**Target akhirnya:** aplikasi tetap sederhana dari sisi fitur, tetapi terasa seperti aplikasi task management profesional dari sisi UI/UX. Dengan Vanilla JS + Express + MySQL, ini juga bagus untuk latihan memahami alur **Frontend → REST API → Backend → Database** secara utuh.