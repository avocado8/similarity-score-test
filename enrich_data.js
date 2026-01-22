const fs = require('fs');
const axios = require('axios');
const path = require('path');
const readline = require('readline');

// Configuration
const TARGET_FILE = path.join(__dirname, 'drawing.json');
const TOTAL_ITEMS_NEEDED = 100;
const CATEGORIES_URL = 'https://raw.githubusercontent.com/googlecreativelab/quickdraw-dataset/master/categories.txt';
// Color palette: Red, Green, Blue, Black, Yellow, Purple, Orange
const PALETTE = [
  [0, 0, 0], // black
  [239, 68, 68], // red
  [59, 130, 246], // blue
  [34, 197, 94], // green
  [250, 204, 21], // yellow
];

// Helper: Get random integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Helper: Get random item from array
function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Download file stream
async function downloadStream(url) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    });
    return response.data;
}

async function main() {
    try {
        console.log('Fetching category list...');
        const catResponse = await axios.get(CATEGORIES_URL);
        const categories = catResponse.data.split('\n').filter(c => c.length > 0);
        
        console.log(`Found ${categories.length} categories.`);
        
        // Randomly select 10 categories to sample from
        const selectedCategories = [];
        const numCategories = 10;
        for (let i = 0; i < numCategories; i++) {
            selectedCategories.push(getRandomItem(categories));
        }
        console.log('Selected categories:', selectedCategories);

        let newDrawings = [];
        const itemsPerCategory = Math.ceil(TOTAL_ITEMS_NEEDED / numCategories); // roughly 10

        for (const category of selectedCategories) {
            console.log(`Processing category: ${category}`);
            // QuickDraw uses GCS. simplified data: 
            // https://storage.googleapis.com/quickdraw_dataset/full/simplified/${category}.ndjson
            // Categories might have spaces, proper URL encoding usually needed, but QuickDraw filenames verify.
            // Actually checking the bucket structure, filenames are url encoded.
            const safeCategory = encodeURIComponent(category);
            const url = `https://storage.googleapis.com/quickdraw_dataset/full/simplified/${safeCategory}.ndjson`;

            try {
                const stream = await downloadStream(url);
                const rl = readline.createInterface({
                    input: stream,
                    crlfDelay: Infinity
                });

                let count = 0;
                for await (const line of rl) {
                    try {
                        const data = JSON.parse(line);
                        
                        if (data.recognized === true) {
                            // Transform data
                            const entry = {
                                points: data.drawing, // drawing is [[x...], [y...], [t...]] or [[x...], [y...]]
                                // drawing.json expects [[x...], [y...]] usually checks length to be secure
                                // QuickDraw simplified is [[x, y], [x, y]] for each stroke?
                                // Wait, QuickDraw simplified format:
                                // "drawing": [
                                //   [ [x, x, ...], [y, y, ...] ], <--- Stroke 1
                                //   [ [x, x, ...], [y, y, ...] ]  <--- Stroke 2
                                // ]
                                // drawing.json format based on view_file:
                                // "points": [
                                //   [ [x...], [y...] ], 
                                //   [ [x...], [y...] ]
                                // ]
                                // It seems identical.
                                color: getRandomItem(PALETTE)
                            };

                            // Check compatibility just in case (remove time dimension if present)
                            // QuickDraw simplified usually doesn't have time. Raw does. 
                            // We are using simplified.
                            
                            newDrawings.push(entry);
                            count++;
                        }
                    } catch (e) {
                        // ignore parse error
                    }
                    if (count >= itemsPerCategory) {
                        rl.close();
                        break; // Move to next category
                    }
                }
            } catch (err) {
                console.error(`Error downloading/processing ${category}:`, err.message);
            }
        }

        // Shuffle newDrawings
        newDrawings = newDrawings.sort(() => 0.5 - Math.random());
        
        // Trim to exact needed
        if (newDrawings.length > TOTAL_ITEMS_NEEDED) {
            newDrawings = newDrawings.slice(0, TOTAL_ITEMS_NEEDED);
        }

        console.log(`collected ${newDrawings.length} new items.`);

        // Read existing file
        let existingData = [];
        if (fs.existsSync(TARGET_FILE)) {
            const fileContent = fs.readFileSync(TARGET_FILE, 'utf8');
            existingData = JSON.parse(fileContent);
        }

        // Append
        // drawing.json structure is [ [ {points, color}, ... ], [ ... ] ]?
        // Let's re-verify drawing.json structure.
        // Line 1: [
        // Line 2:   [
        // Line 3:     {
        // Line 4:       "points": [...],
        // Line 14:      "color": [...]
        // Line 15:    },
        // Line 31:  [
        // It seems to be an Array of Arrays of Objects?
        // User request: "데이터를 drawing.json에 추가"
        // "drawing.json에 있는 형식과 동일한 스트로크 데이터로 변환"
        // The file has multiple groups (arrays) of strokes. 
        // Do I add a NEW group (Array) with 100 items? 
        // Or do I add 100 items to the existing groups?
        // Or do I make each item a group?
        // Looking at drawing.json:
        // [
        //   [ {points, color}, {points, color} ... ], // Group 1
        //   [ {points, color}, ... ], // Group 2
        //   ...
        // ]
        // It seems like a list of "drawings", where each drawing is composed of multiple strokes?
        // Wait, let's look closely at `drawing.json` again.
        // Line 3: { points: [...], color: [...] } -> ONE stroke?
        // Line 16: { points: [...], color: [...] } -> ANOTHER stroke?
        // So `[ {points, color}, {points, color} ]` is ONE drawing composed of multiple strokes.
        // QuickDraw data: One "drawing" (item) contains multiple strokes: `data.drawing` is an array of strokes.
        // Structure of QuickDraw: `[[x,y], [x,y]]` (one stroke).
        // `data.drawing` = [ stroke1, stroke2 ].
        
        // In `drawing.json`: 
        // Outer Array = List of "Canvases" or "Sessions"?
        // Inner Array = List of "Strokes" in that session.
        // Each object = A stroke.
        
        // The user says: "데이터에서 true로 분리된것 중 랜덤하게 100개 정도 선정" (Select 100 items from true recognized data) and "drawing.json에 있는 형식과 동일한 스트로크 데이터로 변환".
        // If I take ONE QuickDraw item (e.g. a Cat), it has MULTIPLE strokes.
        // Should I add ONE QuickDraw item as ONE Inner Array?
        // Yes, that makes sense. One QuickDraw item = One drawing entry in the top-level list.
        
        // So if I download 100 items, I should append 100 arrays to the main array.
        // Each of those arrays will contain Objects representing strokes.
        // For QuickDraw item:
        // Strokes = `data.drawing` (Array of [x,y] arrays).
        // For each stroke in `data.drawing`:
        // Convert to { points: stroke, color: random_color }
        // Wait, "원본 데이터에 스트로크 색이 없으므로 스트로크에 랜덤하게 색상 추가 필요".
        // Does "Stroke" get a color? Yes, based on drawing.json structure: `{ points: ..., color: ... }`.
        // So for one QuickDraw item (which has N strokes), does every stroke get the SAME color, or RANDOM color?
        // User said: "스트로크에 랜덤하게 색상 추가 필요".
        // It could mean per-stroke or per-drawing.
        // Usually, a drawing has one color or multiple.
        // In drawing.json, Group 1 has: Red, Black, Green. So different colors per stroke is supported.
        // I will assign a random color TO EACH STROKE.
        
        const finalData = [];
        
        for (const item of newDrawings) {
            // item.points is the array of strokes from QuickDraw: [ [[x],[y]], [[x],[y]] ]
            const strokeObjects = item.points.map(stroke => ({
                points: stroke,
                color: getRandomItem(PALETTE)
            }));
            finalData.push(strokeObjects);
        }

        // Combine
        const updatedData = existingData.concat(finalData);

        fs.writeFileSync(TARGET_FILE, JSON.stringify(updatedData, null, 2));
        console.log(`Successfully added ${finalData.length} drawings to ${TARGET_FILE}`);

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
