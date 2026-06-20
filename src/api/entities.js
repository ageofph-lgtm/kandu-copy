import { base44 } from './base44Client';

export const Query = base44.entities.Query;

// Entidades (exportadas para quem importa de "@/api/entities")
export const Job = base44.entities.Job;
export const Application = base44.entities.Application;
export const ChatMessage = base44.entities.ChatMessage;
export const Rating = base44.entities.Rating;
export const Notification = base44.entities.Notification;
export const Blacklist = base44.entities.Blacklist;

// auth sdk (utilizador)
export const User = base44.auth;
