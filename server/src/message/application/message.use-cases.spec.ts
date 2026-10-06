import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { toPage } from '../../common/http/pagination.dto';
import { GetReadableConversation } from '../../conversation/application/conversation.use-cases';
import { Message } from '../domain/message';
import { MESSAGE_REPOSITORY } from '../domain/message.repository';
import {
  GetMessage,
  ListMessages,
  SearchInConversation,
  SearchUserMessages,
} from './message.use-cases';

const message = () =>
  Message.rehydrate({
    id: 'm1',
    conversationId: 'c1',
    content: 'Bonjour',
    isFromAi: false,
    model: null,
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('Message use cases', () => {
  const messages = {
    findById: jest.fn(),
    listForConversation: jest.fn(),
    searchInConversation: jest.fn(),
    searchForUser: jest.fn(),
  };
  const readable = { execute: jest.fn() };

  let list: ListMessages;
  let searchConversation: SearchInConversation;
  let searchAll: SearchUserMessages;
  let get: GetMessage;

  beforeEach(async () => {
    jest.clearAllMocks();
    readable.execute.mockResolvedValue({ id: 'c1' });
    messages.findById.mockResolvedValue(message());
    messages.listForConversation.mockResolvedValue(toPage([message()], 1));

    const module = await Test.createTestingModule({
      providers: [
        ListMessages,
        SearchInConversation,
        SearchUserMessages,
        GetMessage,
        { provide: MESSAGE_REPOSITORY, useValue: messages },
        { provide: GetReadableConversation, useValue: readable },
      ],
    }).compile();

    list = module.get(ListMessages);
    searchConversation = module.get(SearchInConversation);
    searchAll = module.get(SearchUserMessages);
    get = module.get(GetMessage);
  });

  describe('ListMessages', () => {
    it('checks the conversation is readable before reading anything', async () => {
      readable.execute.mockRejectedValue(new BadRequestException());

      await expect(list.execute('c1', 'u2')).rejects.toThrow(BadRequestException);
      expect(messages.listForConversation).not.toHaveBeenCalled();
    });

    it('reads the page once access is granted', async () => {
      await list.execute('c1', 'u1', { limit: 10 });

      expect(messages.listForConversation).toHaveBeenCalledWith('c1', { limit: 10 });
    });
  });

  describe('SearchInConversation', () => {
    it('refuses to search a conversation the user cannot read', async () => {
      readable.execute.mockRejectedValue(new BadRequestException());

      await expect(searchConversation.execute('c1', 'u2', 'nest')).rejects.toThrow(
        BadRequestException,
      );
      expect(messages.searchInConversation).not.toHaveBeenCalled();
    });
  });

  describe('SearchUserMessages', () => {
    it('ignores a keyword too short to be useful', async () => {
      const page = await searchAll.execute('u1', ' a ');

      expect(page.items).toEqual([]);
      expect(messages.searchForUser).not.toHaveBeenCalled();
    });

    it('trims the keyword before searching', async () => {
      messages.searchForUser.mockResolvedValue(toPage([], 0));

      await searchAll.execute('u1', '  nest  ', { limit: 5 });

      expect(messages.searchForUser).toHaveBeenCalledWith('u1', 'nest', { limit: 5 });
    });
  });

  describe('GetMessage', () => {
    it('reports an unknown message before checking any access', async () => {
      messages.findById.mockResolvedValue(null);

      await expect(get.execute('absent', 'u1')).rejects.toThrow(NotFoundException);
      expect(readable.execute).not.toHaveBeenCalled();
    });

    it('checks access against the conversation holding the message', async () => {
      await get.execute('m1', 'u1');

      expect(readable.execute).toHaveBeenCalledWith('c1', 'u1');
    });
  });
});
