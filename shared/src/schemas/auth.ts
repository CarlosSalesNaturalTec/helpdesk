import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    novaSenha: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
    confirmacaoSenha: z.string().min(6, 'A confirmação de senha deve ter no mínimo 6 caracteres'),
  })
  .refine((data) => data.novaSenha === data.confirmacaoSenha, {
    message: 'A nova senha e a confirmação não coincidem',
    path: ['confirmacaoSenha'],
  });
