import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def generate_200_page_pdf(output_path: str = "test_document_200_pages.pdf"):
    """
    Generates a 200-page academic study material PDF for testing
    incremental parsing, bounded chunking, and page-level error recovery.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    topics = [
        "Computational Complexity and Big-O Bounds",
        "Divide-and-Conquer Paradigm and Recurrence Relations",
        "Greedy Algorithms and Matroid Theory",
        "Dynamic Programming and Optimal Substructure",
        "Graph Algorithms: Breadth-First and Depth-First Search",
        "Shortest Paths: Dijkstra and Bellman-Ford",
        "Minimum Spanning Trees: Kruskal and Prim",
        "Network Flow: Ford-Fulkerson and Max-Flow Min-Cut",
        "NP-Completeness and Polynomial-Time Reductions",
        "Approximation Algorithms and Heuristics"
    ]

    print(f"Generating 200-page test PDF at: {output_path}...")

    for page_num in range(1, 201):
        topic_idx = ((page_num - 1) // 20) % len(topics)
        current_topic = topics[topic_idx]
        chapter_num = ((page_num - 1) // 20) + 1

        # Header
        c.setFont("Helvetica-Bold", 14)
        c.drawString(54, height - 54, f"Chapter {chapter_num}: {current_topic}")

        c.setFont("Helvetica", 10)
        c.drawString(54, height - 74, f"StudyPath Comprehensive Test Corpus — Page {page_num} of 200")
        c.setStrokeColorRGB(0.7, 0.7, 0.8)
        c.line(54, height - 80, width - 54, height - 80)

        # Section Heading
        c.setFont("Helvetica-Bold", 12)
        c.drawString(54, height - 110, f"Section {chapter_num}.{(page_num % 5) + 1}: Foundational Theorems and Formulations")

        # Body Text
        c.setFont("Helvetica", 10)
        y = height - 140

        paragraphs = [
            f"This section discusses analytical techniques for {current_topic.lower()}.",
            "Theorem Statement: Let G = (V, E) be a directed or undirected graph where each edge (u, v) carries weight w(u, v).",
            "Under standard asymptotic analysis, we evaluate worst-case time complexity T(n) as the input dimension n grows without bound.",
            "Key Formula: Master Theorem evaluation T(n) = a*T(n/b) + f(n), where a >= 1 and b > 1 are constants.",
            "Recurrence relation boundary conditions must be verified at base size n_0 = 1 to guarantee termination.",
            "Sample Exercise: Given a dataset of N elements, determine the optimal pivot strategy to avoid worst-case partition degradation."
        ]

        # Insert intentional edge case on page 47: minimal content or warning testing
        if page_num == 47:
            paragraphs = ["Page 47 contains simulated boundary diagnostic data. System verification marker."]

        for p in paragraphs:
            c.drawString(54, y, p)
            y -= 22

        # Tabular Data Example
        c.setFont("Helvetica-Bold", 10)
        c.drawString(54, y - 20, "Complexity Reference Table:")
        y -= 40
        c.setFont("Courier", 9)
        c.drawString(60, y, "| Operation       | Best Case | Average Case | Worst Case |")
        y -= 15
        c.drawString(60, y, "| Search          | O(1)      | O(log n)     | O(log n)   |")
        y -= 15
        c.drawString(60, y, "| Insert          | O(1)      | O(log n)     | O(log n)   |")
        y -= 15
        c.drawString(60, y, "| Delete          | O(1)      | O(log n)     | O(log n)   |")

        # Footer
        c.setFont("Helvetica-Oblique", 9)
        c.drawString(54, 36, "StudyPath Practice Corpus • Original Educational Material")
        c.drawRightString(width - 54, 36, f"Page {page_num}")

        c.showPage()

    c.save()
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Successfully generated 200-page PDF! File size: {file_size_mb:.2f} MB")
    return output_path

if __name__ == "__main__":
    generate_200_page_pdf()
