import { Agenda } from 'agenda';

declare module '@hapi/hapi' {
  interface ServerApplicationState {
    agenda: Agenda;
  }
}