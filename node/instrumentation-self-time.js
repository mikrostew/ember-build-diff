/* eslint no-param-reassign: 0, no-console: 0 */

// For use with instrumentation.*.json files from BROCCOLI_VIZ=1 ember b (or similar commands)

// Run like:
//  node instrumentation-self-time.js <file1> , <file2>, ...

// This script:
// * parses the instrumentation.*.json files,
// * also does other things...

const fs = require('fs');

const files = process.argv.slice(2);

files.forEach((filename) => {
  console.log(`Processing file '${filename}'...`);

  const json = JSON.parse(fs.readFileSync(filename, 'utf8'));
  let stats = {};
  let totalTime = 0;
  let parentLookup = {};

  // iterate through the nodes once to map child IDs to parent names (for the *Patch nodes)
  // this makes the lookup a lot faster in the next loop
  json.nodes.forEach((node) => {
    let parentName = node.label.name;
    node.children.forEach((childID) => {
      parentLookup[childID] = parentName;
    });
  });

  json.nodes.forEach((node) => {

    let nodeName = node.label.name;
    let nodeID = node.id;

    // special cases for these nodes:
    // * applyPatches
    // * applyPatch
    // * derivePatches
    // because by themselves they don't tell us much - it's their parent nodes that we care about
    if (nodeName == "applyPatches" || nodeName == "applyPatch" || nodeName == "derivePatches") {
      nodeName = `${nodeName}: ${parentLookup[nodeID]}`;
    }

    if (stats[nodeName] === undefined) {
      // doesn't exist, add it
      stats[nodeName] = {
        id: nodeName,
        selftime: node.stats.time.self,
        calls: 1,
      };
    } else {
      // already exists, update
      stats[nodeName].selftime += node.stats.time.self;
      stats[nodeName].calls += 1;
    }

    // keep track of total time
    totalTime += node.stats.time.self;
  });

  console.log(`Total time: ${totalTime / (1000 * 1000 * 1000)}`);

  let statsArray = Object.keys(stats).map((k) => stats[k]);

  // sort descending order by self time
  let sortedStats = statsArray.sort((a, b) => b.selftime - a.selftime);

  // convert nanoseconds to seconds for readability
  // and calculate percentage of total time
  sortedStats.forEach((stat) => {
    stat.percent = 100 * (stat.selftime / totalTime);
    stat.selftime /= 1000 * 1000 * 1000;
  });

  // write that out to a file
  let selfTimeFile = `${filename}-selftime.json`;
  console.log(`Writing file '${selfTimeFile}'`);
  fs.writeFileSync(selfTimeFile, JSON.stringify(sortedStats, null, 2));

  // next, combine things so I can get a sense of Babel vs Eyeglass vs other

  // should clean this up to avoid all the repetition, but whatever
  let combinedStats = {};
  ['eyeglass', 'babel', 'cleanup', 'command', 'patch', 'other'].forEach(node => {
    combinedStats[node] = {
      id: node,
      time: 0,
      calls: 0,
      percent: 0,
    }
  });

  let eyeglassRegex = /eyeglass/i;
  let babelRegex = /babel/i;
  let templateCompilerRegex = /templatecompiler/i;
  let cleanupRegex = /cleanup/i;
  let commandRegex = /command/i;
  let patchRegex = /patch/i;

  // should clean this up to avoid all the repetition, but whatever
  sortedStats.forEach((stat) => {
    if (stat.id.match(babelRegex)) {
      combinedStats.babel.time += stat.selftime;
      combinedStats.babel.calls += stat.calls;
      combinedStats.babel.percent += stat.percent;
    } else if (stat.id.match(templateCompilerRegex)) {
      // this is also a babel thing
      combinedStats.babel.time += stat.selftime;
      combinedStats.babel.calls += stat.calls;
      combinedStats.babel.percent += stat.percent;
    } else if (stat.id.match(eyeglassRegex)) {
      combinedStats.eyeglass.time += stat.selftime;
      combinedStats.eyeglass.calls += stat.calls;
      combinedStats.eyeglass.percent += stat.percent;

    // for the rest of these, I'm going to lump them together in "other" for now
    // (these should probably be split out under "other", but for now it's too much info)
    //
    // } else if (stat.id.match(cleanupRegex)) {
    //   combinedStats.cleanup.time += stat.selftime;
    //   combinedStats.cleanup.calls += stat.calls;
    //   combinedStats.cleanup.percent += stat.percent;
    // } else if (stat.id.match(commandRegex)) {
    //   combinedStats.command.time += stat.selftime;
    //   combinedStats.command.calls += stat.calls;
    //   combinedStats.command.percent += stat.percent;
    // } else if (stat.id.match(patchRegex)) {
    //   combinedStats.patch.time += stat.selftime;
    //   combinedStats.patch.calls += stat.calls;
    //   combinedStats.patch.percent += stat.percent;

    } else {
      combinedStats.other.time += stat.selftime;
      combinedStats.other.calls += stat.calls;
      combinedStats.other.percent += stat.percent;
    }
  });

  let combinedArray = Object.keys(combinedStats).map((k) => combinedStats[k]);

  // sort descending order by self time
  let sortedCombinedStats = combinedArray.sort((a, b) => b.time - a.time);

  // write that out to a file
  let combinedTimeFile = `${filename}-combined.json`;
  console.log(`Writing file '${combinedTimeFile}'`);
  fs.writeFileSync(combinedTimeFile, JSON.stringify(sortedCombinedStats, null, 2));
});

