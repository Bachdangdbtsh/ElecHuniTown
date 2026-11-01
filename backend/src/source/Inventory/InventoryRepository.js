import {prisma} from "../../lib/prisma.js"

// Lay thong tin nguoi dung toi thieu
const userBrief = {
    select : { id: true, fullName: true }
}

// Lay thong tin phieu nhap/xuat toi thieu
const documentInclude = {
    supplier: true,
    createdBy: userBrief,
    handledBy: userBrief,
    items: {
        include: {
            product: {
                select : { id: true, name: true}
            }
        }
    }
}


// Cau hinh so trang hien thi trong 1 lan truy van, khong hien thi toan bo de giam so lan truy van
const paging = ({ page, pageSize }) => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

// Chuan hoa ket qua truy van thanh 1 object chung
const paged = (items, total, { page, pageSize }) => ({
  items,
  total,
  page,
  pageSize,
});

const dateFilter = (from, to) => {
    from || to 
    ? {
        createdAt: {
            ...(from && {gte: from}),
            ...(to && {lte: to})
        }
    } : { }
}

export function getReceiptByID(db, receiptID) {
    // TODO
}

export function getIssueByID(db, issueID) {
    // TODO
}

export async function findReceipts(db, query) {
    const {status, supplierID, from, to} = query

    // dieu kien loc du lieu
    const where = {
        ...(status && { status }),
        ...(supplierID && { supplierID }),
        ...(dateFilter(from, to))
    }

    // thuc hien 2 query cung luc: 1 cai tim kiem tat ca 
    const [items, total] = await Promise.all([
        db.StockReceipt.findMany({
            where,
            orderBy: {createdAt: 'desc'},
            ...paging(query),
            // optional: Lay them thong tin 
            include: {
                supplier: {select: {id: true, name: true}},
                createdBy: userBrief,
                _count: { select: {items: true}},
            }
        }),
        db.StockReceipt._count({where}),
    ])

    return paged(items, total, query)
}

