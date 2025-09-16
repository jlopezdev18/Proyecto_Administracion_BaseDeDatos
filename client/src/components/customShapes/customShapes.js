import { dia, shapes } from "@joint/core";


export const Entity = dia.Element.define('erd.Entity', {
    size: { width: 150, height: 60 },
    attrs: {
        '.outer': {
            fill: '#2ECC71', stroke: '#27AE60', 'stroke-width': 2,
            points: '100,0 100,60 0,60 0,0'
        },
        '.inner': {
            fill: '#2ECC71', stroke: '#27AE60', 'stroke-width': 2,
            points: '95,5 95,55 5,55 5,5',
            display: 'none'
        },
        text: {
            text: 'Entity',
            'font-family': 'Arial', 'font-size': 14,
            'ref-x': .5, 'ref-y': .5,
            'y-alignment': 'middle', 'text-anchor': 'middle'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><polygon class="outer"/><polygon class="inner"/></g><text/></g>',
    useCSSSelectors: true
});

export const Relationship = dia.Element.define('erd.Relationship', {
    size: { width: 80, height: 80 },
    attrs: {
        '.outer': {
            fill: '#3498DB', stroke: '#2980B9', 'stroke-width': 2,
            points: '40,0 80,40 40,80 0,40'
        },
        '.inner': {
            fill: '#3498DB', stroke: '#2980B9', 'stroke-width': 2,
            points: '40,5 75,40 40,75 5,40',
            display: 'none'
        },
        text: {
            text: 'Relationship',
            'font-family': 'Arial', 'font-size': 12,
            'ref-x': .5, 'ref-y': .5,
            'y-alignment': 'middle', 'text-anchor': 'middle'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><polygon class="outer"/><polygon class="inner"/></g><text/></g>',
    useCSSSelectors: true
});

export const Attribute = dia.Element.define('erd.Attribute', {
    size: { width: 100, height: 50 },
    attrs: {
        'ellipse': {
            transform: 'translate(50, 25)'
        },
        '.outer': {
            stroke: '#D35400', 'stroke-width': 2,
            cx: 0, cy: 0, rx: 50, ry: 25,
            fill: '#E67E22'
        },
        '.inner': {
            stroke: '#D35400', 'stroke-width': 2,
            cx: 0, cy: 0, rx: 45, ry: 20,
            fill: '#E67E22', display: 'none'
        },
        text: {
            'font-family': 'Arial', 'font-size': 14,
            'ref-x': .5, 'ref-y': .5,
            'y-alignment': 'middle', 'text-anchor': 'middle'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><ellipse class="outer"/><ellipse class="inner"/></g><text/></g>',
    useCSSSelectors: true
});

export const Key = Attribute.define('erd.Key', {
    attrs: {
        ellipse: { 'stroke-width': 4 },
        text: { text: 'key', 'font-weight': '800', 'text-decoration': 'underline' }
    }
});

export const MultivaluedAttribute = dia.Element.define('erd.MultivaluedAttribute', {
    size: { width: 110, height: 55 },
    attrs: {
        'ellipse': {
            transform: 'translate(55, 27.5)'
        },
        '.outer': {
            stroke: '#059669', 'stroke-width': 3,
            cx: 0, cy: 0, rx: 55, ry: 27.5,
            fill: '#fff'
        },
        '.inner': {
            stroke: '#059669', 'stroke-width': 2,
            cx: 0, cy: 0, rx: 45, ry: 20,
            fill: '#fff'
        },
        text: {
            'font-family': 'Arial', 'font-size': 14,
            'ref-x': .5, 'ref-y': .5,
            'y-alignment': 'middle', 'text-anchor': 'middle',
            fill: '#059669',
            fontWeight: 'bold'
        }
    }
}, {
    markup: '<g class="rotatable"><g class="scalable"><ellipse class="outer"/><ellipse class="inner"/></g><text/></g>',
    useCSSSelectors: true
});