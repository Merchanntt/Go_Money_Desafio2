import { getCustomRepository, getRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';
import CreateCategoryService from './CategoryService';
import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryName: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryName,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Type invalid', 400);
    }

    if (
      type === 'outcome' &&
      value > (await transactionsRepository.getBalance()).total
    ) {
      throw new AppError('Not able to complete the transaction', 400);
    }

    const categoryRepositoty = getRepository(Category);
    let category = await categoryRepositoty.findOne({
      where: { title: categoryName },
    });

    if (!category) {
      const createCategory = new CreateCategoryService();
      category = await createCategory.execute({ title: categoryName });
    }

    const transaction = transactionsRepository.create({
      category_id: category.id,
      title,
      value,
      type,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
