import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const booksFilePath = path.join(process.cwd(), 'data', 'books.json');

export async function GET() {
  try {
    const data = await fs.readFile(booksFilePath, 'utf8');
    const books = JSON.parse(data);
    return NextResponse.json(books);
  } catch (error) {
    console.error('Error reading books data:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, stock } = body;

    if (!id || stock === undefined || stock < 0) {
      return NextResponse.json({ error: 'Valid id and stock are required' }, { status: 400 });
    }

    const data = await fs.readFile(booksFilePath, 'utf8');
    const books: { id: string; title: string; author: string; price: number; stock: number }[] = JSON.parse(data);

    const book = books.find((b) => b.id === id);
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    book.stock = stock;
    await fs.writeFile(booksFilePath, JSON.stringify(books, null, 2), 'utf8');

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error updating book stock:', error);
    return NextResponse.json({ error: 'Failed to update book stock' }, { status: 500 });
  }
}
