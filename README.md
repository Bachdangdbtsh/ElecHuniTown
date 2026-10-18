# ElecHuniTown

Ứng dụng web bán hàng và quản lý kinh doanh cho cửa hàng điện gia dụng ElecHuniTown.

- **Sàn thương mại điện tử:** khách hàng xem, tìm kiếm, đặt hàng, thanh toán (mô phỏng), theo dõi đơn hàng. Nhân viên và chủ cửa hàng quản lý sản phẩm, xử lý đơn hàng.
- **Công cụ quản lý kinh doanh:** theo dõi tồn kho, quản lý nhập xuất hàng, thống kê doanh thu, lợi nhuận, xu hướng mua sắm và phản hồi của khách hàng.

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router), JavaScript |
| Backend | Express.js 5, JavaScript (ES Modules) |
| ORM, migration | Prisma 6 |
| Cơ sở dữ liệu | PostgreSQL 17 |
| Xác thực | JWT (`jsonwebtoken`), mã hóa mật khẩu bằng `bcrypt` |
| Kiểm tra dữ liệu vào | Zod |

## 1. Yêu cầu cài đặt

Cài đủ các công cụ sau **trước khi** clone dự án. Cả nhóm dùng cùng phiên bản chính để tránh lỗi "máy tôi chạy được, máy bạn thì không".

| Công cụ | Phiên bản | Kiểm tra bằng lệnh |
|---|---|---|
| Node.js | **24.x** (bản đang dùng: 24.19.0). Tối thiểu 22 | `node --version` |
| npm | Đi kèm Node.js | `npm --version` |
| PostgreSQL | **17.x** (bản đang dùng: 17.11) | `psql --version` |
| Git | Bản mới | `git --version` |
| VS Code (khuyến nghị) | Extension: ESLint, Prettier, Prisma | |

### Cài PostgreSQL trên Windows

1. Tải bản cài đặt PostgreSQL 17 từ trang chính thức postgresql.org.
2. Trong lúc cài, **tên tài khoản `postgres`**, **mật khẩu `admin123`** (tài khoản quản trị).
3. Giữ cổng mặc định **5432**.
4. Nếu lệnh `psql` không được nhận trong terminal, thêm thư mục sau vào environment variables `PATH`, rồi mở lại terminal:

   ```
   C:\Program Files\PostgreSQL\17\bin
   ```

   Hoặc dùng ứng dụng **SQL Shell (psql)** có sẵn trong Start Menu sau khi cài.

## 2. Lấy mã nguồn

```
git clone https://github.com/Bachdangdbtsh/elechunitown.git
cd elechunitown
```

## 3. Tạo user và database

Mỗi thành viên có **một PostgreSQL riêng trên máy mình**, nên dữ liệu không dùng chung. Cả nhóm chỉ dùng chung cấu trúc bảng (qua migration).

Mở terminal và đăng nhập bằng tài khoản quản trị (nhập mật khẩu đã đặt lúc cài PostgreSQL):

```
psql -U postgres
```

Chạy các lệnh SQL sau trong `psql`:

```sql
CREATE USER elec WITH PASSWORD 'secret' CREATEDB;
CREATE DATABASE elechunitown      OWNER elec;
CREATE DATABASE elechunitown_test OWNER elec;
CREATE DATABASE elechunitown_demo OWNER elec;
\q
```

- Quyền `CREATEDB` là **bắt buộc**, vì `prisma migrate dev` cần tạo một database tạm để so sánh cấu trúc bảng.
- Nếu báo user hoặc database đã tồn tại, bỏ qua dòng đó. Nếu user `elec` đã có nhưng không nhớ mật khẩu, chạy `ALTER USER elec WITH PASSWORD 'secret' CREATEDB;`.
- Mật khẩu `secret` chỉ dùng cho máy dev. Nếu đổi, nhớ sửa cho khớp trong `DATABASE_URL` ở bước 5.

Kiểm tra đăng nhập được bằng user mới (nhập `secret` khi được hỏi):

```
psql -U elec -h localhost -d elechunitown
```

Vào được dấu nhắc `elechunitown=>` là đạt. Gõ `\q` để thoát.

## 4. Cài thư viện

Chạy **ở từng thư mục**, không chạy ở thư mục gốc:

```
cd backend
npm install
cd ../frontend
npm install
cd ..
```

## 5. Tạo file biến môi trường

File `.env` chứa thông tin riêng của từng máy, **không được đưa lên Git**. Dự án cung cấp file mẫu, bạn sao chép ra rồi chỉnh nếu cần.

Trong **Command Prompt (cmd)**:

```
copy backend\.env.example backend\.env
copy frontend\.env.local.example frontend\.env.local
```

Trong **Git Bash hoặc macOS/Linux**:

```
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Nội dung `backend/.env` cần có đủ các biến sau (giá trị mẫu dùng được ngay nếu bạn làm đúng bước 3):

```
NODE_ENV=development
DATABASE_URL="postgresql://elec:secret@localhost:5432/elechunitown"
JWT_SECRET="chuoi-ngau-nhien-dai-cho-dev"
JWT_EXPIRES_IN="30m"
CLIENT_ORIGIN="http://localhost:3000"
PORT=4000
```

Nội dung `frontend/.env.local` có đúng một dòng:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Lưu ý:

- Trong `DATABASE_URL`, định dạng là `postgresql://TÊN_USER:MẬT_KHẨU@localhost:CỔNG/TÊN_DATABASE`. Nếu máy bạn dùng cổng khác 5432 thì sửa số cổng.
- Nếu mật khẩu có ký tự đặc biệt như `@`, `#`, `/` thì kết nối dễ lỗi. Với môi trường dev, dùng mật khẩu chỉ gồm chữ và số.
- Không đặt thông tin bí mật vào biến bắt đầu bằng `NEXT_PUBLIC_`, vì chúng bị phơi ra trình duyệt.
- File `.env` phải lưu ở dạng UTF-8, không có dấu cách thừa quanh dấu `=`, và tên file phải đúng là `.env` (không phải `.env.txt`).

## 6. Tạo bảng trong database

```
cd backend
npm run db:migrate
```

Lệnh này áp dụng toàn bộ migration trong thư mục `backend/prisma/migrations` lên database `elechunitown`, đồng thời sinh Prisma Client. Chạy thành công sẽ thấy thông báo "Your database is now in sync with your schema".

Kiểm tra bảng bằng giao diện web của Prisma:

```
npm run db:studio
```

Trình duyệt mở ra và hiển thị các bảng hiện có.

> Prisma có thể báo "Update available ... 8.0.0". **Không nâng cấp.** Cả nhóm dùng Prisma 6 (đã ghim trong `package.json`).

## 7. Chạy dự án

Dùng **hai cửa sổ terminal riêng**. Chạy backend trước.

**Terminal 1, backend:**

```
cd backend
npm run dev
```

Thành công khi thấy dòng `API chạy tại http://localhost:4000`.

**Terminal 2, frontend:**

```
cd frontend
npm run dev
```

Thành công khi thấy `Ready` và địa chỉ `http://localhost:3000`.

| Dịch vụ | Địa chỉ |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| PostgreSQL | localhost:5432 |

Sửa file `.env` hoặc `.env.local` xong thì phải **dừng bằng `Ctrl + C` và chạy lại** server tương ứng.

## 8. Kiểm tra cài đặt thành công

| Kiểm tra | Kết quả đúng |
|---|---|
| Mở http://localhost:4000/health | `{"status":"ok"}` (backend chạy và kết nối được PostgreSQL) |
| Mở http://localhost:3000 | Hiện dòng **Backend: ok** (frontend gọi được backend) |
| `npm run db:studio` trong `backend` | Thấy các bảng trong database |

Cả ba đạt nghĩa là chuỗi Next.js, Express, Prisma, PostgreSQL đã thông suốt.

## 9. Cấu trúc thư mục

```
elechunitown/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # định nghĩa các bảng
│   │   └── migrations/          # lịch sử thay đổi cấu trúc bảng (có commit)
│   ├── src/
│   │   ├── server.js            # khởi động server
│   │   ├── app.js               # cấu hình Express, gắn route
│   │   ├── config/env.js        # đọc và kiểm tra biến môi trường
│   │   ├── lib/prisma.js        # PrismaClient dùng chung
│   │   ├── common/errors/       # AppError, errorHandler
│   │   └── modules/             # các module nghiệp vụ (xem bên dưới)
│   ├── .env                     # KHÔNG commit
│   └── .env.example             # file mẫu, có commit
├── frontend/
│   ├── app/                     # trang và route của Next.js
│   ├── components/
│   ├── lib/
│   ├── .env.local               # KHÔNG commit
│   └── .env.local.example       # file mẫu, có commit
├── docs/                        # use case, ERD, class diagram
├── .gitignore
└── README.md
```

Mỗi module nghiệp vụ trong `backend/src/modules/` gồm các tầng: 
- `routes` (khai báo URL)
- `controller` (nhận request, trả response)
- `service` (luật nghiệp vụ, transaction)
- `repository` (truy vấn Prisma)

Các module dự kiến: `auth`, `role`, `catalog`, `inventory`, `order`, `review`, `statistic`, `audit` (có thể mở rộng tuỳ theo phạm vi project).

## 10. Lệnh thường dùng

Trong thư mục `backend`:

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy server, tự khởi động lại khi sửa code |
| `npm run start` | Chạy server không theo dõi thay đổi |
| `npm run db:migrate` | Tạo và áp dụng migration (**chỉ dùng trên máy dev**) |
| `npm run db:deploy` | Chỉ áp dụng migration đã có, không tạo mới |
| `npm run db:studio` | Mở giao diện xem dữ liệu |

Trong thư mục `frontend`:

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy Next.js ở chế độ developer |
| `npm run build` | Build bản production |
| `npm run lint` | Kiểm tra lỗi code |

## 11. Quy tắc làm việc nhóm

### Git

- **Không code trực tiếp trên `main`.** Mỗi người làm trên nhánh riêng, đặt tên theo dạng `feature/<name>` (ví dụ `feature/Bach`).
- Quy trình mỗi lần làm việc:

  ```
  git checkout main
  git pull
  git checkout -b feature/<name>
  ```

  Sau khi sửa code:

  ```
  git add .
  git status
  git commit -m "feat(inventory): them phieu nhap kho"
  git push -u origin feature/<name>
  ```

  Rồi tạo **Pull Request** trên GitHub, nhờ một thành viên khác xem qua trước khi merge vào `main`.
- Thông điệp commit theo dạng `loai(pham-vi): mo ta`, với `loai` bao gồm 4 dạng chính: `feat` (tính năng mới), `fix` (sửa lỗi), `chore` (việc phụ, cấu hình), `docs` (tài liệu).
- **Luôn chạy `git status` trước khi commit** để chắc chắn không có `.env`, `.env.local`, `node_modules`, `.next` trong danh sách.
- Nếu lỡ commit file `.env`, báo cả nhóm ngay để đổi mật khẩu và `JWT_SECRET`.

### Cơ sở dữ liệu

- Đổi cấu trúc bảng: sửa `backend/prisma/schema.prisma`, rồi chạy `npm run db:migrate -- --name mo_ta_ngan` trong `backend`. Commit cả thư mục `migrations` mới sinh ra.
- **Không sửa hay xóa migration đã commit.** Muốn đổi lại thì tạo migration mới.
- Sau khi `git pull` mà có migration mới của người khác, chạy lại `npm run db:migrate` trong `backend` để cập nhật database máy mình.
- Pull code mới mà `package.json` thay đổi thì chạy lại `npm install` trong thư mục tương ứng.

### Bảo mật và quy ước

- Phân quyền kiểm tra theo **mã quyền** (ví dụ `INVENTORY_MANAGE`), không theo tên vai trò. Quyền thật do **backend** kiểm tra, frontend chỉ ẩn hiện menu cho tiện.
- Không trả dữ liệu thô từ database ra API, đặc biệt không để lộ mật khẩu và giá vốn cho khách hàng.
- Tiền tệ lưu bằng **số nguyên VND**, không dùng số thực.
- Tên endpoint dạng số nhiều, `kebab-case`: `/products`, `/stock-receipts`.

## 12. Xử lý lỗi thường gặp

| Thông báo hoặc hiện tượng | Nguyên nhân và cách xử lý |
|---|---|
| `P1000: Authentication failed` | Sai user hoặc mật khẩu trong `DATABASE_URL`, hoặc chưa tạo user `elec`. Làm lại bước 3 và kiểm tra bằng `psql -U elec -h localhost -d elechunitown` |
| `P1001: Can't reach database server` | PostgreSQL chưa chạy hoặc sai cổng. Mở `services.msc`, tìm dịch vụ PostgreSQL và bật lên |
| `migrate dev` báo không tạo được shadow database | User `elec` thiếu quyền. Chạy `ALTER USER elec CREATEDB;` trong `psql` bằng tài khoản `postgres` |
| `Thieu bien moi truong: JWT_SECRET, CLIENT_ORIGIN` | File `backend/.env` thiếu biến hoặc không nằm đúng thư mục `backend`. Đối chiếu với bước 5, rồi chạy lại server |
| `Missing script: "dev"` hoặc `Could not read package.json` | Đang đứng sai thư mục. Lệnh `npm` phải chạy trong `backend` hoặc `frontend` |
| `Cannot find module '.../src/server.js'` hoặc thiếu file | Clone chưa đủ hoặc đang đứng sai thư mục. Chạy `git pull` và kiểm tra lại |
| `node: bad option: --env-file` | Node quá cũ. Nâng lên Node 22 trở lên |
| Frontend hiện "KHÔNG kết nối được backend" | Backend chưa chạy, hoặc `CLIENT_ORIGIN` trong `backend/.env` không đúng `http://localhost:3000`, hoặc `frontend/.env.local` sai. Sửa xong phải khởi động lại cả hai |
| Cổng 3000 hoặc 4000 đã bị chiếm | Tắt chương trình đang dùng cổng đó, hoặc đổi `PORT` trong `backend/.env` (nhớ đổi `NEXT_PUBLIC_API_URL` cho khớp) |
| Máy có hai bản PostgreSQL, tranh cổng 5432 | Kiểm tra cổng thực tế của bản bạn dùng và sửa trong `DATABASE_URL` |
| Cảnh báo `LF will be replaced by CRLF` | Bình thường trên Windows, bỏ qua |
| Dữ liệu trong DB mỗi máy mỗi khác | Bình thường vì mỗi người một PostgreSQL riêng. Dữ liệu mẫu dùng chung sẽ được nạp bằng seed khi có |

## 13. Lưu ý trên Windows

- Các lệnh trong README này viết cho **Command Prompt (cmd)** hoặc **Git Bash**. Nếu dùng PowerShell và gặp lỗi cú pháp, chuyển sang một trong hai cái trên.
- Cmd không có tùy chọn `mkdir -p` và `cp`. Dùng `mkdir thu-muc` và `copy nguon dich`.
- Khi tạo file có tên bắt đầu bằng dấu chấm (`.env`, `.gitignore`), dùng VS Code để tạo, tránh Notepad vì dễ bị thêm đuôi `.txt` ẩn. Bật hiển thị đuôi file trong File Explorer (View, rồi chọn File name extensions) để kiểm tra.

## 14. Danh sách kiểm tra nhanh cho thành viên mới

- [ ] Cài Node.js 24, PostgreSQL 17, Git
- [ ] Clone repo
- [ ] Tạo user `elec` và các database (bước 3)
- [ ] `npm install` ở `backend` và `frontend`
- [ ] Tạo `backend/.env` và `frontend/.env.local` từ file mẫu
- [ ] `npm run db:migrate` trong `backend`
- [ ] Chạy backend, mở `http://localhost:4000/health` thấy `{"status":"ok"}`
- [ ] Chạy frontend, mở `http://localhost:3000` thấy "Backend: ok"
- [ ] `git status` sạch, không có `.env` trong danh sách commit

Nếu làm theo đúng README mà vẫn không chạy được, hãy báo cho cả nhóm kèm **nguyên văn thông báo lỗi** để cùng sửa README cho đầy đủ hơn.

## 15. (Optional) Làm việc với Figma trên IDE (VS Code)
Nếu bạn muốn tích hợp Figma vào trong VS Code để không phải chuyển tab khi lập trình, hãy làm các bước theo thứ tự như sau:
- Bước 1: Truy cập URL file Mockup chung của dự án: https://www.figma.com/design/ozyiDKhNaioPaJ1EzpsLhn/L08_0_Mockup_master_file?node-id=2001-5&t=U7GpH3GzUs7neffc-1
- Bước 2: Ở góc trái màn hình, chọn chế độ Design --> Chọn MCP --> Chọn VS Code --> chọn Install in VS Code
- Bước 3: Làm các bước mà VS Code hướng dẫn (Lưu ý: chọn chế độ Global để thay đổi). Bạn tích hợp VS Code Agent thành công khi ở trang Figma, ở phần MCP xuất hiện dòng "1 connection"
- Bước 4: Mở VS Code --> Chọn Extensions ở sidebar --> Nhập Figma for VS Code --> Install
- Bước 5: Sau khi Install thành công sẽ xuất hiện icon "Figma" ở cuối sidebar. Click vào biểu tượng này --> Chọn Sign-in --> Đăng nhập lại trên Figma
- Bước 6: Sau khi đăng nhập trên Figma, VS Code sẽ lấy được tất cả các canvas trong account.
- Bước 7: Chọn canvas muốn thiết kế để tiếp tục làm việc.
