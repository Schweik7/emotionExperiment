// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export interface ParticipantResponse {
  // 开始和结束时间
  startWatchingTime?: string;
  endWatchingTime?: string;
  // 情绪评分
  excitedIntensity: number;
  excitedFrequency: number;
  // alertIntensity 和 alertFrequency 已删除
  tenseIntensity: number;
  tenseFrequency: number;
  anxiousIntensity: number;
  anxiousFrequency: number;
  terrifiedIntensity: number;
  terrifiedFrequency: number;
  desperateIntensity: number;
  desperateFrequency: number;
  physicalDiscomfort: number;
  psychologicalDiscomfort: number;
}

export const experimentApi = {
  createParticipant: async (name: string) => {
    const response = await api.post('/participants', { name });
    return response.data;
  },

  submitResponse: async (participantId: number, data: ParticipantResponse) => {
    const response = await api.post('/responses', {
      participantId,
      ...data
    });
    return response.data;
  }
};