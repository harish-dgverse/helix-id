import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const ordersFilePath = path.join(process.cwd(), 'data', 'orders.json');
const booksFilePath = path.join(process.cwd(), 'data', 'books.json');

export async function GET() {
  try {
    const data = await fs.readFile(ordersFilePath, 'utf8');
    const orders = JSON.parse(data);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error reading orders data:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { book_id, quantity, ordered_by } = body;

    if (!book_id || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'book_title and quantity are required' }, { status: 400 });
    }

    // Read books to validate and get price
    const booksData = await fs.readFile(booksFilePath, 'utf8');
    const books: { id: string; title: string; author: string; price: number; stock: number }[] = JSON.parse(booksData);

    const book = books.find((b) => b.id == book_id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }
    if (book.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Deduct stock
    book.stock -= quantity;
    await fs.writeFile(booksFilePath, JSON.stringify(books, null, 2), 'utf8');

    // Create new order
    const ordersData = await fs.readFile(ordersFilePath, 'utf8');
    const orders: object[] = JSON.parse(ordersData);

    const newOrder = {
      order_id: Math.floor(1000 + Math.random() * 9000),
      book_title: book.title,
      quantity,
      total_price: parseFloat((book.price * quantity).toFixed(2)),
      status: 'Order Placed',
      created_at: new Date().toISOString(),
      ordered_by,
    };

    orders.push(newOrder);
    await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
