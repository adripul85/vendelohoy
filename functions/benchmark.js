const performTask = async (id, delayMs) => {
    return new Promise((resolve) => setTimeout(() => resolve(`Task ${id} done`), delayMs));
};

async function runSequential(docs) {
    const results = [];
    for (const doc of docs) {
        try {
            await performTask(doc, 50); // Simulating 50ms task
            results.push({ id: doc, status: 'success' });
        } catch (e) {
            results.push({ id: doc, status: 'error' });
        }
    }
    return results;
}

async function runParallel(docs) {
    const results = await Promise.all(docs.map(async (doc) => {
        try {
            await performTask(doc, 50); // Simulating 50ms task
            return { id: doc, status: 'success' };
        } catch (e) {
            return { id: doc, status: 'error' };
        }
    }));
    return results;
}

async function main() {
    const docs = Array.from({ length: 50 }, (_, i) => i);

    console.time('Sequential');
    await runSequential(docs);
    console.timeEnd('Sequential');

    console.time('Parallel');
    await runParallel(docs);
    console.timeEnd('Parallel');
}

main();