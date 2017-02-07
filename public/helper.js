export class Helper {

    getFirstLine(text) {
        const indexOfFirstLineBreak = text.indexOf('\n');
        if (indexOfFirstLineBreak === -1) {
            return text;
        }
        return text.substring(0, indexOfFirstLineBreak);
    }

    setWindowTitle(title) {
        if (title.length > 0) {
            document.title = title + " - Scribbles";
        }
        else {
            document.title = "Scribbles";
        }
    }
}
