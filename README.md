# Sift
An application to help applicants identify roles that match their resume. 

<img width="1505" height="847" alt="Screenshot 2026-02-28 at 10 57 18 AM" src="https://github.com/user-attachments/assets/e5a7830d-5422-44ed-af80-da1cad9ec044" />

<p align="center">
  <img src="https://github.com/user-attachments/assets/ce16d391-039d-4589-98e0-f0c37fb91d03" width="45%" />
  <img src="https://github.com/user-attachments/assets/2e408483-a688-46be-9538-9c040d5e6856" width="45%" />
</p>

The image on the left is the UI a user sees if they choose to upload a resume and the one on the right shows 'All Jobs'.

Sequence diagram showing the tehnical flow when user uploads a resume.

<img width="8192" height="4672" alt="Job Matching Pipeline with-2026-02-28-145536" src="https://github.com/user-attachments/assets/f53c9c65-1b5e-49f2-b97e-8be8f9d8e30d" />

## Frontend

Frontend developed using **React** and **Typescript** and deployed using **Vercel**. With increased traffic, Vercel can scale automatically to meet increased demands. 

## Backend

Built using **Express.js** and **Typescript** and deployed on **Render**. It handles file upload using Multer, does pdf text extraction using `pdf-parse` and handles makes calls to the database, LLM service and embedding service.

Render's spins down a Free Web Service if there are no request made to it in a window of 15 minutes. This can result in a cold start when new requests are sent. When scaling up it is worth looking into paid options within Render that keep services up always.

## LLM Service

`Llama 3.1 8B Instruct` accessed via HuggingFace is used for providing LLM services. The extracted resume text is sent to the LLM to extract relevant skills and job titles, assign a seniority tier, and short summary of the resume in a JSON format. This model was chosen as structured data.

## Embedding Service

`bge-base-en-v1.5` accessed via HuggingFace was used to create 768-dimension vector embedding. While not the top model it was was selected for its strong performance on English retrieval benchmarks and compatability with HuggingFace's free inference tier. 

## Backend

**PostgreSQL** with **pgvector extension** hosted on **Neon** is used to store the job details and embeddings. Vector similarity is estimated using the cosine similarity operation, `<=>`. Also an **Hierarchical Navigable Small World** (HNSW) index is created on the embedding to make the search quicker. A seniority filter is added in the query during matching to bring down the search space before similarity ranking.

