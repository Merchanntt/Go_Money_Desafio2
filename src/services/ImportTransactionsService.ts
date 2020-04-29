import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
import Transaction from '../models/Transaction';
import UploadConfig from '../config/upload';
import AppError from '../errors/AppError';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  fileName: string;
}

class ImportTransactionsService {
  async execute({ fileName }: Request): Promise<Transaction[]> {
    const createTransactionService = new CreateTransactionService();
    const csvFilePath = path.join(UploadConfig.directory, fileName);
    const readCSVStream = fs.createReadStream(csvFilePath);
    if (!readCSVStream) {
      throw new AppError('Invalid file or file not found');
    }
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });
    const parseCsv = readCSVStream.pipe(parseStream);
    const transactions = [];

    for await (const record of parseCsv) {
      const transaction = await createTransactionService.execute({
        title: record[0],
        type: record[1],
        value: record[2],
        categoryName: record[3],
      });

      transactions.push(transaction);
    }

    await fs.promises.unlink(csvFilePath);
    return transactions;
  }
}

export default ImportTransactionsService;
