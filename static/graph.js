// import { select } from "https://cdn.skypack.dev/d3-selection";

import { forceSimulation, forceLink, forceManyBody, forceCenter } from "https://cdn.jsdelivr.net/npm/d3-force@3.0.0/+esm";

document.addEventListener("DOMContentLoaded", () => {
    const title = document.getElementsByClassName("title")[0].textContent;
    const backlinks = document.getElementsByClassName("backlinks");

    const width = 300;
    const height = 200;

    const nodes = [...backlinks].map(link => ({ id: link.textContent }));

    const links = [...backlinks].map(link => ({
	source: link.textContent,
	target: title
    }));
    nodes.push({ id: title });

    const simulation = forceSimulation(nodes)
	.force("link", forceLink(links).id(d => d.id))
	.force("charge", forceManyBody())
	.force("center", forceCenter(width / 2, height / 2))
	.on("tick", ticked);

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.getElementById("backlink-graph");

    const linkGroup = document.createElementNS(ns, "g");
    const nodeGroup = document.createElementNS(ns, "g");
    svg.appendChild(linkGroup);
    svg.appendChild(nodeGroup);

    links.forEach(link => {
	const line = document.createElementNS(ns, "line");
	line.setAttribute("stroke", "#999");
	line.setAttribute("stroke-opacity", 0.8);
	line.setAttribute("stroke-width", 2);

	linkGroup.appendChild(line);
	link.element = line;
    });

    nodes.forEach(node => {
	const g = document.createElementNS(ns, "g");
	const circle = document.createElementNS(ns, "circle");
	const text = document.createElementNS(ns, "text");

	circle.setAttribute("r", node.id == title ? "8" : "6");
	if (node.id == title) {
	    circle.style.fill = "#8ba4b0";
	} else {
	    circle.style.fill = "#999";
	}
	text.textContent = node.id;
	text.setAttribute("dx", "12");
	text.setAttribute("dy", "4");

	g.style.cursor = "grab";
	g.addEventListener("mousedown", (event) => {
	    event.preventDefault();
	    g.style.cursor = "grabbing";

	    dragstarted(node, event);

	    const onMouseMove = (e) => dragged(node, e);
	    const onMouseUp = (e) => {
		g.style.cursor = "grab";

		dragended(node, e);
		window.removeEventListener("mousemove", onMouseMove);
		window.removeEventListener("mouseup", onMouseUp);
	    };
	    window.addEventListener("mousemove", onMouseMove);
	    window.addEventListener("mouseup", onMouseUp);
	});
	g.appendChild(circle);
	g.appendChild(text);

	nodeGroup.appendChild(g);
	node.element = g;
    });

    function ticked() {
	links.forEach(link => {
	    link.element.setAttribute("x1", link.source.x);
	    link.element.setAttribute("y1", link.source.y);
	    link.element.setAttribute("x2", link.target.x);
	    link.element.setAttribute("y2", link.target.y);
	});

	nodes.forEach(node => {
	    node.element.setAttribute("transform", `translate(${node.x}, ${node.y})`);
	});
    }

    function dragstarted(node, event) {
	if (!event.active) simulation.alphaTarget(0.3).restart();
	node.fx = node.x;
	node.fy = node.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(node, event) {
	node.fx = event.offsetX;
	node.fy = event.offsetY;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(node, kevent) {
	if (!event.active) simulation.alphaTarget(0);
	node.fx = null;
	node.fy = null;
    }
});
