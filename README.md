




Flujo backend, instalar los siguiente paquetes:

npm install drizzle-orm @neondatabase/serverless serverless-http express


// comando para install kit de mirgaciones
npm i -D drizzle-kit



// comandos para crear las tablas en tu motor oficial NEON Postgrsql
npx drizzle-kit generate
npx drizzle-kit migrate
npx drizzle-kit check