from django import template

# Filter to round numbers in result template

register = template.Library()

@register.filter
def round_num(value, arg):
    '''
    Rounds a float number.

    Args:
        value (float): Number to round
        arg (int): Number of decimal positions to leave.

    Returns:
        Rounded number.

    Note:
        This function is needed because no Python functions can be called
        in an HTML template
    '''
    return round(value, arg)