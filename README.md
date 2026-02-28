# Sift

Sift lets applicants skip the endless list of job postings and find positions that actually match their resumes.

<img width="1495" height="849" alt="Screenshot 2026-02-28 at 11 40 35 AM" src="https://github.com/user-attachments/assets/76827e91-a5c9-4bc2-bcdb-6c412302020d" />

<p align="center">

  <img src="https://github.com/user-attachments/assets/ce16d391-039d-4589-98e0-f0c37fb91d03" width="45%" />

  <img src="https://github.com/user-attachments/assets/2e408483-a688-46be-9538-9c040d5e6856" width="45%" />

</p>

The image on the left is the UI a user sees if they choose to upload a resume, and the one on the right shows ‘All Jobs’.

A sequence diagram showing the technical flow when the user uploads a resume.

<img width="8192" height="4672" alt="Job Matching Pipeline with-2026-02-28-145536" src="https://github.com/user-attachments/assets/f53c9c65-1b5e-49f2-b97e-8be8f9d8e30d" />

## Frontend

Frontend developed using **React** and **Typescript** and deployed using **Vercel**. With increased traffic, Vercel can scale automatically to meet increased demands.

## Backend

Built using **Express.js** and **Typescript** and deployed on **Render**. It handles file uploads using Multer, extracts text from PDFs using pdf-parse, and makes calls to the database, LLM service, and embedding service.

***Note:*** Render spins down a Free Web Service if no requests are made to it over a 15-minute window. This can result in a cold start when new requests are sent. When scaling up, we will have to move to a paid Render options to keep services up and running.

## LLM Service

`Llama 3.1 8B Instruct` accessed via **HuggingFace** is used for providing LLM services. The extracted resume text is sent to the LLM to identify relevant skills and job titles, assign a seniority tier, and generate a short resume summary in JSON format. This model was chosen as structured data.

## Embedding Service

`bge-base-en-v1.5` accessed via **HuggingFace** was used to create 768-dimension vector embedding. While not the top model, it was selected for its strong performance on English retrieval benchmarks and compatibility with HuggingFace’s free inference tier.

## Backend

**PostgreSQL** with the **pgvector extension**, hosted on Neon, stores job details and embeddings. Vector similarity is estimated using the cosine similarity operation (`<=>`). Also a **Hierarchical Navigable Small World** (HNSW) index is created on the embedding to make the search quicker. A seniority filter is added to the query during matching to reduce the search space before similarity ranking.
