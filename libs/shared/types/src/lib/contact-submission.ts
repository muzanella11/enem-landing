export interface ContactSubmission {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export type CreateContactSubmissionInput = Pick<
  ContactSubmission,
  'fullname' | 'email' | 'phoneNumber' | 'message'
>;
